import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { isMediaFile, isVideoFile } from '@/shared/media'
import { useSettingsStore } from '@/shared/settings'
import type { localBackground } from '@/shared/settings/types/type'
import type { CachedImage } from '@/shared/storage/idb'

import {
  cacheOnlineWallpaper,
  getCachedOnlineWallpaper,
} from './onlineCacheStore'
import {
  useDarkWallpaperStorge,
  useWallpaperStorge,
  wallpaperUrlCache,
} from './wallpaperStorge'

function isOnlineWallpaperCacheValid(
  cached: CachedImage | null,
  now: number,
  settings: ReturnType<typeof useSettingsStore>,
) {
  if (!cached) return false
  const ageHours = (now - cached.timestamp) / 36e5
  const withinDuration = ageHours <= settings.background.online.cache.duration
  return settings.background.online.cache.noExpires || withinDuration
}

export const useWallpaperUrlStore = defineStore('wallpaperUrl', () => {
  const settings = useSettingsStore()

  const lightUrl = ref('')
  const darkUrl = ref('')
  const requestVersion = {
    light: 0,
    dark: 0,
  } satisfies Record<'light' | 'dark', number>
  const resolvedBackgroundId = {
    light: '',
    dark: '',
  } satisfies Record<'light' | 'dark', string>

  const getTargetRef = (type: 'light' | 'dark') => {
    if (type === 'light') return lightUrl
    return darkUrl
  }

  const currentBackgroundId = (type: 'light' | 'dark') => {
    if (type === 'light') return settings.background.local.id
    return settings.background.localDark.id
  }

  const updateRef = (
    type: 'light' | 'dark',
    url: string,
    backgroundId = currentBackgroundId(type),
  ) => {
    const targetRef = getTargetRef(type)
    const oldUrl = targetRef.value
    if (oldUrl.startsWith('blob:') && oldUrl !== url) {
      URL.revokeObjectURL(oldUrl)
    }
    targetRef.value = url
    resolvedBackgroundId[type] = url ? backgroundId : ''
  }

  const getUrl = async (type: 'light' | 'dark'): Promise<Ref<string>> => {
    const version = ++requestVersion[type]
    let background: localBackground
    if (type === 'light') background = settings.background.local
    else background = settings.background.localDark
    const targetRef = getTargetRef(type)
    const expectedBackgroundId = background.id
    const isLatest = () =>
      requestVersion[type] === version && currentBackgroundId(type) === expectedBackgroundId

    // 弹窗预览与背景组件共享同一个 Store；同一壁纸已经解析时直接复用对象 URL，
    // 避免重复读取 Blob、撤销旧 URL 并触发背景组件重新切换。
    if (
      expectedBackgroundId &&
      resolvedBackgroundId[type] === expectedBackgroundId &&
      targetRef.value
    ) {
      return targetRef
    }

    if (!background.id) {
      if (type === 'dark') {
        if (isLatest()) updateRef(type, '', expectedBackgroundId)
        return getUrl('light')
      }
      if (isLatest()) {
        updateRef(type, '', expectedBackgroundId)
      }
      return targetRef
    }

    const cache = await wallpaperUrlCache.getValue()
    const cachedUrl = cache[type]
    if (cachedUrl) {
      if (cachedUrl.startsWith('blob:')) {
        // Blob URL 特定于上下文，从另一个标签页读取时总是过期的。
        // 跳过获取验证并静默清除过期的缓存条目。
        if (isLatest()) {
          await wallpaperUrlCache.setValue({ ...cache, [type]: '' })
        }
      } else {
        try {
          const res = await fetch(cachedUrl)
          if (res.ok) {
            if (isLatest()) {
              updateRef(type, cachedUrl, expectedBackgroundId)
            }
            return targetRef
          }
        } catch (error) {
          console.warn(
            `[wallpaper] Failed to validate cached ${type} wallpaper URL, cache will reset:`,
            error,
          )
        }
        if (isLatest()) {
          await wallpaperUrlCache.setValue({ ...cache, [type]: '' })
        }
      }
    }

    let file: Blob | null = null

    if (type === 'light') {
      file = await useWallpaperStorge.getItem<Blob>(background.id)
    } else if (type === 'dark') {
      file = await useDarkWallpaperStorge.getItem<Blob>(background.id)
    }

    if (file && isMediaFile(file)) {
      const url = URL.createObjectURL(file)
      if (!isLatest()) {
        URL.revokeObjectURL(url)
        return targetRef
      }

      if ((type === 'dark' || type === 'light') && !background.mediaType) {
        background.mediaType = isVideoFile(file) ? 'video' : 'image'
      }

      // Blob URL 特定于上下文；不要将其存储在会话缓存中。
      updateRef(type, url, expectedBackgroundId)
      return targetRef
    }

    if (isLatest()) {
      updateRef(type, '', expectedBackgroundId)
    }
    return targetRef
  }

  const triggerRefresh = (type: 'light' | 'dark') => {
    void getUrl(type).catch((error) => {
      console.error(`Failed to get ${type} wallpaper URL:`, error)
    })
  }

  watch(
    () => settings.background.local.id,
    () => triggerRefresh('light'),
  )
  watch(
    () => settings.background.localDark.id,
    () => triggerRefresh('dark'),
  )

  const setUrl = async (type: 'light' | 'dark', url: string) => {
    requestVersion[type] += 1
    const cache = await wallpaperUrlCache.getValue()
    // 如果有旧的 URL，先撤销
    const cachedUrl = cache[type]
    if (cachedUrl.startsWith('blob:') && cachedUrl !== url) {
      URL.revokeObjectURL(cachedUrl)
    }

    // 仅缓存非 blob URL（例如在线 HTTP URL）。
    // Blob URL 特定于上下文，对任何其他标签页都会过期。
    if (url.startsWith('blob:')) {
      // 清除任何过期的缓存条目，以便下一个标签页不会尝试验证它。
      if (cachedUrl) {
        await wallpaperUrlCache.setValue({ ...cache, [type]: '' })
      }
    } else {
      await wallpaperUrlCache.setValue({ ...cache, [type]: url })
    }
    updateRef(type, url)
  }

  const clearUrl = async (type: 'light' | 'dark') => {
    requestVersion[type] += 1
    const cache = await wallpaperUrlCache.getValue()
    // 如果有旧的 URL，先撤销
    const cachedUrl = cache[type]
    if (cachedUrl.startsWith('blob:')) {
      URL.revokeObjectURL(cachedUrl)
    }

    await wallpaperUrlCache.setValue({ ...cache, [type]: '' })
    updateRef(type, '')
  }

  // --- 在线壁纸状态与解析 ---
  const onlineUrl = ref('')
  const isOnlineLoading = ref(false)
  let resolvedOnlineRawUrl = ''
  let onlineRequestVersion = 0
  let onlineFetchController: AbortController | null = null
  let inFlightOnlinePromise: Promise<string> | null = null

  const updateOnlineRef = (url: string, rawUrl = settings.background.online.url) => {
    const oldUrl = onlineUrl.value
    if (oldUrl.startsWith('blob:') && oldUrl !== url) {
      URL.revokeObjectURL(oldUrl)
    }
    onlineUrl.value = url
    resolvedOnlineRawUrl = url ? rawUrl : ''
  }

  const getOnlineUrl = async (
    targetRawUrl?: string,
    forceRefresh = false,
  ): Promise<string> => {
    const rawUrl = targetRawUrl ?? settings.background.online.url
    if (!rawUrl) {
      onlineRequestVersion += 1
      onlineFetchController?.abort()
      onlineFetchController = null
      inFlightOnlinePromise = null
      updateOnlineRef('', '')
      isOnlineLoading.value = false
      return ''
    }

    // 弹窗预览与背景组件共享同一个 Store；同一壁纸已经解析时直接复用，
    // 避免重复网络下载及 Blob 撤销导致的背景闪烁或延迟。
    if (!forceRefresh && resolvedOnlineRawUrl === rawUrl && onlineUrl.value) {
      return onlineUrl.value
    }

    // 若同一 URL 已有在途下载请求，直接复用该 Promise，彻底消除重复并发请求。
    if (!forceRefresh && inFlightOnlinePromise && resolvedOnlineRawUrl === rawUrl) {
      return inFlightOnlinePromise
    }

    const version = ++onlineRequestVersion
    resolvedOnlineRawUrl = rawUrl
    onlineFetchController?.abort()
    onlineFetchController = new AbortController()
    const { signal } = onlineFetchController

    isOnlineLoading.value = true

    const fetchPromise = (async () => {
      try {
        // Peapix 图床（img.peapix.com）不带 CORS 头，fetch 必然失败；
        // 直接使用原始 URL 展示，避免无谓的网络报错与等待。
        if (
          settings.background.online.source === 'peapix' ||
          rawUrl.startsWith('https://img.peapix.com/')
        ) {
          if (version !== onlineRequestVersion) return onlineUrl.value
          updateOnlineRef(rawUrl, rawUrl)
          return rawUrl
        }

        const now = Date.now()
        const useCache = settings.background.online.cache.enabled
        const cached = useCache && !forceRefresh ? await getCachedOnlineWallpaper(rawUrl) : null

        if (cached && isOnlineWallpaperCacheValid(cached, now, settings)) {
          if (version !== onlineRequestVersion) return onlineUrl.value
          const blobUrl = URL.createObjectURL(cached.blob)
          updateOnlineRef(blobUrl, rawUrl)
          return blobUrl
        }

        let blob: Blob | null = null
        try {
          const res = await fetch(rawUrl, { signal })
          if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
          blob = await res.blob()
        } catch (e) {
          if (e instanceof DOMException && e.name === 'AbortError') {
            return onlineUrl.value
          }
          // 无 CORS 或网络异常时静默降级：优先复用旧缓存，否则回退为原始 URL。
          if (cached) {
            if (version !== onlineRequestVersion) return onlineUrl.value
            const blobUrl = URL.createObjectURL(cached.blob)
            updateOnlineRef(blobUrl, rawUrl)
            return blobUrl
          }
          if (version !== onlineRequestVersion) return onlineUrl.value
          updateOnlineRef(rawUrl, rawUrl)
          return rawUrl
        }

        if (version !== onlineRequestVersion) return onlineUrl.value

        if (useCache && blob) {
          await cacheOnlineWallpaper(rawUrl, { blob, timestamp: now })
        }

        if (version !== onlineRequestVersion) return onlineUrl.value

        const blobUrl = blob ? URL.createObjectURL(blob) : rawUrl
        updateOnlineRef(blobUrl, rawUrl)
        return blobUrl
      } finally {
        if (version === onlineRequestVersion) {
          isOnlineLoading.value = false
          inFlightOnlinePromise = null
        }
      }
    })()

    inFlightOnlinePromise = fetchPromise
    return fetchPromise
  }

  const clearOnlineUrl = () => {
    onlineRequestVersion += 1
    onlineFetchController?.abort()
    onlineFetchController = null
    inFlightOnlinePromise = null
    updateOnlineRef('', '')
    isOnlineLoading.value = false
  }

  return {
    getUrl,
    setUrl,
    clearUrl,
    lightUrl,
    darkUrl,
    onlineUrl,
    isOnlineLoading,
    getOnlineUrl,
    clearOnlineUrl,
  }
})
