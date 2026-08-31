import { BgType } from '@/shared/enums'
import { useSettingsStore } from '@/shared/settings'

import { fetchOnlineSourceUrl, type OnlineWallpaperSource } from './onlineSource'

export const ONLINE_REFRESH_INTERVAL = 24 * 60 * 60 * 1000 // 默认每天自动换一次

let store: ReturnType<typeof useSettingsStore> | null = null

function getStore() {
  if (!store) store = useSettingsStore()
  return store
}

/**
 * 刷新在线壁纸。
 * - 预设图源（picsum / peapix）：拉取一张新图并更新 `online.url`，Background 会监听变化自动重载。
 * - 自定义 URL：不换图，返回 'reload' 交由调用方清缓存重载；自动刷新时跳过。
 * @returns 'applied' 已更换新图；'reload' 需重载当前 URL；'none' 无需处理
 */
export async function refreshOnlineWallpaper(): Promise<'applied' | 'reload' | 'none'> {
  const settings = getStore()
  const source = settings.background.online.source as OnlineWallpaperSource

  if (source === 'custom') return 'reload'

  const url = await fetchOnlineSourceUrl(source)
  if (!url) return 'none'

  const previousUrl = settings.background.online.url
  // 换新图前记录上一张，便于自动切换后挽回。
  if (previousUrl && previousUrl !== url) settings.background.online.previousUrl = previousUrl
  settings.background.online.url = url
  settings.background.online.lastAutoRefresh = Date.now()
  if (settings.background.bgType !== BgType.Online) settings.background.bgType = BgType.Online
  return 'applied'
}

/** 是否到了自动刷新时间（在线壁纸 + 已开启自动刷新 + 预设图源） */
export function isOnlineWallpaperAutoRefreshDue(now = Date.now()): boolean {
  const settings = getStore()
  const { online, bgType } = settings.background
  if (!online.autoRefresh || bgType !== BgType.Online) return false
  if (online.source === 'custom') return false
  if (now - online.lastAutoRefresh < ONLINE_REFRESH_INTERVAL) return false
  return true
}
