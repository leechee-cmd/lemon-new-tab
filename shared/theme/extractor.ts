import { hexFromArgb, sourceColorFromImageBytes } from '@material/material-color-utilities'
import { storage } from '#imports'

export interface ExtractedWallpaperColor {
  color: string
  sourceKey: string
  timestamp: number
}

export const wallpaperExtractedColorStorage = storage.defineItem<ExtractedWallpaperColor | null>(
  'local:wallpaperExtractedColor',
  { fallback: null },
)

/**
 * 从图片 Blob 中提取符合 Material Design 3 规范的主题主色调
 * @param blob 图片 Blob
 * @param sourceKey 可选的壁纸唯一标识（用于缓存直出）
 */
export async function extractThemeColorFromBlob(
  blob: Blob,
  sourceKey?: string,
): Promise<string | null> {
  if (!blob || blob.size === 0) return null

  // 视频格式无法直接作为静态图片取色
  if (blob.type.startsWith('video/')) return null

  if (sourceKey) {
    try {
      const cached = await wallpaperExtractedColorStorage.getValue()
      if (cached && cached.sourceKey === sourceKey && cached.color) {
        return cached.color
      }
    } catch {
      // 忽略缓存读取错误
    }
  }

  try {
    const MAX_SIZE = 64
    let imageData: Uint8ClampedArray | null = null

    if (typeof createImageBitmap !== 'undefined') {
      const bitmap = await createImageBitmap(blob, {
        resizeWidth: MAX_SIZE,
        resizeHeight: MAX_SIZE,
        resizeQuality: 'low',
      })

      if (typeof OffscreenCanvas !== 'undefined') {
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0)
          imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data
        }
      } else if (typeof document !== 'undefined') {
        const canvas = document.createElement('canvas')
        canvas.width = bitmap.width
        canvas.height = bitmap.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0)
          imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height).data
        }
      }
      bitmap.close()
    }

    // 降级使用 HTMLImageElement + Canvas
    if (!imageData && typeof document !== 'undefined') {
      const url = URL.createObjectURL(blob)
      try {
        const img = new Image()
        img.src = url
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('Failed to load image blob for color extraction'))
        })

        const canvas = document.createElement('canvas')
        canvas.width = MAX_SIZE
        canvas.height = MAX_SIZE
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, MAX_SIZE, MAX_SIZE)
          imageData = ctx.getImageData(0, 0, MAX_SIZE, MAX_SIZE).data
        }
      } finally {
        URL.revokeObjectURL(url)
      }
    }

    if (!imageData || imageData.length === 0) return null

    const argb = sourceColorFromImageBytes(imageData)
    const hex = hexFromArgb(argb)

    if (sourceKey && hex) {
      await wallpaperExtractedColorStorage.setValue({
        color: hex,
        sourceKey,
        timestamp: Date.now(),
      })
    }

    return hex
  } catch (error) {
    console.warn('[theme] Failed to extract theme color from wallpaper blob:', error)
    return null
  }
}
