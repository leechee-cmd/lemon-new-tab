import fetchJsonp from '@/shared/network/fetchJsonp'

function baiduJsonpParser(text: string): string[] {
  const match = /\[.*\]/.exec(text)
  if (match?.[0]) {
    return JSON.parse(match[0])
  }
  throw new Error(`Invalid Baidu suggestion response: ${text}`)
}

async function baiduSuggestParser(text: string, signal?: AbortSignal): Promise<string[]> {
  const url = `https://suggestion.baidu.com/su?wd=${encodeURIComponent(text)}&cb=window.baidu.sug`
  const raw = await fetchJsonp({
    url,
    params: {},
    callbackParam: 'cb',
    callbackName: 'window.baidu.sug',
    encoding: 'gbk', // 百度搜索建议 API 使用 GBK 编码
    signal,
  })

  const suggestions = baiduJsonpParser(raw)

  if (suggestions[0] === text) {
    return suggestions.slice(1)
  }

  return suggestions
}

interface GoogleSuggest {
  [index: number]: unknown
  0: string
  1: string[]
  2: string[]
  3: unknown[]
  4: {
    'google:clientdata': {
      bpc: boolean
      tlw: boolean
    }
    'google:suggestrelevance': number[]
    'google:suggestsubtypes': number[][]
    'google:suggesttype': string[]
    'google:verbatimrelevance': number
  }
}

async function googleSuggestParser(text: string, signal?: AbortSignal): Promise<string[]> {
  const base = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(text)}`

  // Web 端无 CORS，走 script-tag JSONP。
  const raw = await fetchJsonp({
    url: base,
    params: { client: 'chrome', q: text },
    callbackParam: 'callback',
    callbackName: '__leetab_sug',
    signal,
  })
  const parsed = JSON.parse(raw) as GoogleSuggest
  return parsed[1]
}

export { baiduSuggestParser, googleSuggestParser }
