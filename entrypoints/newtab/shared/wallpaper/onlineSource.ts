export type OnlineWallpaperSource = 'picsum' | 'peapix' | 'custom'

/** Lorem Picsum：不同 seed 返回不同图，用于「换新图」时生成新 URL */
export function createPicsumUrl(): string {
  const seed = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`
  return `https://picsum.photos/seed/${seed}/1920/1080`
}

/** Peapix：通过公开 API 拉取当日 Bing 高清壁纸直链 */
export async function fetchPeapixUrl(): Promise<string> {
  const res = await fetch('https://peapix.com/bing/feed?n=1')
  if (!res.ok) throw new Error(`Peapix request failed: ${res.status}`)
  const data = (await res.json()) as Array<{ fullUrl?: string }> | null
  const url = data?.[0]?.fullUrl ?? ''
  if (!url) throw new Error('Peapix returned no image')
  return url
}

/** 根据来源拉取一张新的在线壁纸 URL */
export async function fetchOnlineSourceUrl(source: OnlineWallpaperSource): Promise<string> {
  if (source === 'picsum') return createPicsumUrl()
  if (source === 'peapix') return fetchPeapixUrl()
  return ''
}
