import { idbClear, idbDeleteMany, idbGet, idbGetAllEntries, idbSet } from '@/shared/storage/idb'
import type { CachedImage } from '@/shared/storage/idb'

/** 在线壁纸缓存上限：仅保留「当前一张 + 上一张」，「恢复上一张」依赖上一张。 */
const ONLINE_WALLPAPER_CACHE_LIMIT = 2

function logOnlineWallpaperCacheFailure(
  operation: 'read' | 'write' | 'clear',
  error: unknown,
  url?: string,
) {
  const target = url ? ` for ${url}` : ''
  console.warn(`[wallpaper-cache] ${operation} failure${target}:`, error)
}

/**
 * 获取缓存的在线壁纸
 * @param url 壁纸URL
 * @returns 缓存的数据，如果不存在则返回 null
 */
export async function getCachedOnlineWallpaper(url: string): Promise<CachedImage | null> {
  try {
    return (await idbGet('onlineWallpaperCache', url)) ?? null
  } catch (error) {
    logOnlineWallpaperCacheFailure('read', error, url)
    return null
  }
}

/**
 * 缓存在线壁纸
 * @param url 壁纸URL
 * @param cacheData 缓存数据（Blob + 时间戳）
 */
export async function cacheOnlineWallpaper(url: string, cacheData: CachedImage): Promise<void> {
  try {
    await idbSet('onlineWallpaperCache', url, cacheData)
    await evictExcessOnlineWallpaperCache()
  } catch (error) {
    logOnlineWallpaperCacheFailure('write', error, url)
  }
}

/**
 * 写入后顺带做 LRU 淘汰：超过上限时按写入时间删除最旧的条目。
 * 只缓存当前与上一张即可，避免「换一张」累积大量永不使用的图片。
 */
async function evictExcessOnlineWallpaperCache(): Promise<void> {
  try {
    const entries = await idbGetAllEntries('onlineWallpaperCache')
    if (entries.length <= ONLINE_WALLPAPER_CACHE_LIMIT) return
    const staleKeys = entries
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, entries.length - ONLINE_WALLPAPER_CACHE_LIMIT)
      .map(([key]) => key)
    await idbDeleteMany('onlineWallpaperCache', staleKeys)
  } catch (error) {
    logOnlineWallpaperCacheFailure('clear', error)
  }
}

/**
 * 清除所有在线壁纸缓存
 */
export async function clearAllOnlineWallpaperCache(url?: string): Promise<void> {
  try {
    if (url) URL.revokeObjectURL(url)
    await idbClear('onlineWallpaperCache')
  } catch (error) {
    logOnlineWallpaperCacheFailure('clear', error, url)
  }
}
