import { defineStore } from 'pinia'
import { ref } from 'vue'
import { storage } from '#imports'

import { useSettingsStore } from '@/shared/settings'

import type { QuickLink } from './quickLinksStorage'

/** 连接方式：自动（按探测结果）/ 强制本地 / 强制公网 */
export type LanMode = 'auto' | 'forceLocal' | 'forceRemote'
/** 探测结果：未知（未探测/未配置探针）/ 在家（本地可达）/ 在外（本地不可达） */
export type LanProbeStatus = 'unknown' | 'home' | 'away'

const lanModeStorage = storage.defineItem<{ mode: LanMode }>('local:lanMode', {
  fallback: { mode: 'auto' },
})

export const useLanModeStore = defineStore('lanMode', () => {
  const settings = useSettingsStore()

  const mode = ref<LanMode>('auto')
  const probeStatus = ref<LanProbeStatus>('unknown')

  /** 同一轮探测的防抖 Promise，避免并发重复探测 */
  let probeTask: Promise<LanProbeStatus> | null = null

  /** 是否为内网链接（配置了本地地址即视为内网链接） */
  const isLanLink = (link: Pick<QuickLink, 'localUrl'>): boolean => Boolean(link.localUrl)

  /** 读取持久化的连接方式（仅接受合法值，异常数据回退 auto） */
  async function init(): Promise<void> {
    const stored = await lanModeStorage.getValue()
    mode.value =
      stored?.mode === 'forceLocal' || stored?.mode === 'forceRemote' ? stored.mode : 'auto'
  }

  /** 更新连接方式并持久化；切回 auto 且尚未探测时补一次探测 */
  function setMode(next: LanMode): void {
    mode.value = next
    void lanModeStorage.setValue({ mode: next })
    if (next === 'auto' && probeStatus.value === 'unknown') {
      void probeOnce()
    }
  }

  /**
   * 解析一个快速导航链接最终应打开的地址。
   * 非内网链接一律返回公网地址；内网链接按当前模式与探测结果决定。
   */
  function resolveLanLinkUrl(link: QuickLink): string {
    // 总开关关闭时完全休眠：一律走公网地址，忽略 localUrl
    if (!settings.lanModeEnabled) return link.url
    if (!link.localUrl) return link.url
    if (mode.value === 'forceLocal') return link.localUrl
    if (mode.value === 'forceRemote') return link.url
    // auto：在家走本地，其余（unknown/away）走公网
    return probeStatus.value === 'home' ? link.localUrl : link.url
  }

  /**
   * 执行一次探测：探测本地地址是否可达（请求成功 = 在家，reject/超时 = 在外）。
   * 判定的是「主机可达」而非「服务健康」，因此：
   * - 必须用 GET（HEAD 兼容性差会误判）；
   * - 必须用 no-cors：局域网设备（路由器/NAS/自建服务）大多不带 CORS 头，
   *   若用默认 cors 模式，在未授予主机权限时请求会被浏览器拒绝而误判为「在外」，
   *   导致自动切换失效。no-cors 下只要网络层可达即视为在家（opaque 响应）。
   */
  async function probe(): Promise<LanProbeStatus> {
    const probeUrl = settings.probeUrl?.trim()
    if (!probeUrl) {
      probeStatus.value = 'unknown'
      return 'unknown'
    }
    try {
      await fetch(probeUrl, {
        method: 'GET',
        mode: 'no-cors',
        signal: AbortSignal.timeout(settings.probeTimeout),
      })
      probeStatus.value = 'home'
      return 'home'
    } catch {
      probeStatus.value = 'away'
      return 'away'
    }
  }

  /** 探测防抖：同一轮内复用进行中的 Promise */
  function probeOnce(): Promise<LanProbeStatus> {
    if (probeTask) return probeTask
    probeTask = probe().finally(() => {
      probeTask = null
    })
    return probeTask
  }

  return {
    mode,
    probeStatus,
    isLanLink,
    init,
    setMode,
    probe,
    probeOnce,
    resolveLanLinkUrl,
  }
})
