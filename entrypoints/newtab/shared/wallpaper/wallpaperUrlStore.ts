import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { isMediaFile, isVideoFile } from '@/shared/media'
import { useSettingsStore } from '@/shared/settings'
import type { localBackground } from '@/shared/settings/types/type'

import {
  useDarkWallpaperStorge,
  useWallpaperStorge,
  wallpaperUrlCache,
} from './wallpaperStorge'

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

  return { getUrl, setUrl, clearUrl, lightUrl, darkUrl }
})
