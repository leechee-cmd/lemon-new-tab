interface fetchJsonpOptions {
  url: string
  params: Record<string, string>
  callbackParam: string
  callbackName: string
  encoding?: string // 可选的编码参数
  signal?: AbortSignal
  timeout?: number
}

/**
 * 在 window 上安装带命名空间的 callback（如 `window.baidu.sug`）。
 * 返回清理函数；resolve 在 script 触发 callback 时被调用。
 */
function installCallback(
  target: Record<string, unknown>,
  name: string,
  onData: (data: unknown) => void,
): () => void {
  const segments = name.split('.')
  const fnName = segments[segments.length - 1]!
  let scope = target
  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i]!
    scope[seg] ??= {}
    scope = scope[seg] as Record<string, unknown>
  }
  scope[fnName] = (data: unknown) => onData(data)
  return () => {
    delete scope[fnName]
  }
}

/** 真正的 JSONP：通过 <script> 注入实现，无 CORS 限制。 */
function fetchJsonpByScript(
  scriptSrc: string,
  callbackName: string,
  charset?: string,
  signal?: AbortSignal,
  timeout = 5000,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = null
    const script = document.createElement('script')

    let cleaned = false
    const cleanup = () => {
      if (cleaned) return
      cleaned = true
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      removeCallback()
      script.remove()
    }

    const removeCallback = installCallback(
      window as unknown as Record<string, unknown>,
      callbackName,
      (data) => {
        cleanup()
        resolve(data)
      },
    )

    if (signal) {
      if (signal.aborted) {
        cleanup()
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      signal.addEventListener(
        'abort',
        () => {
          cleanup()
          reject(new DOMException('Aborted', 'AbortError'))
        },
        { once: true },
      )
    }

    if (timeout > 0) {
      timer = setTimeout(() => {
        cleanup()
        reject(new Error(`JSONP request timed out: ${scriptSrc}`))
      }, timeout)
    }

    script.src = scriptSrc
    script.async = true
    if (charset) script.charset = charset
    script.onerror = () => {
      cleanup()
      reject(new Error(`JSONP request failed: ${scriptSrc}`))
    }
    document.head.appendChild(script)
  })
}

/**
 * JSONP 请求实现，返回原始响应文本（供各 parser 自行解析）。
 * 通过真实 script-tag JSONP 绕过 CORS，callback 入参被序列化回文本。
 */
async function fetchJsonp(options: fetchJsonpOptions): Promise<string> {
  const { url, params, callbackParam, callbackName } = options
  const fullUrl = new URL(url)
  for (const [key, value] of Object.entries(params)) {
    fullUrl.searchParams.set(key, value)
  }
  fullUrl.searchParams.set(callbackParam, callbackName)

  const data = await fetchJsonpByScript(
    fullUrl.toString(),
    callbackName,
    options.encoding,
    options.signal,
    options.timeout,
  )
  return typeof data === 'string' ? data : JSON.stringify(data)
}

export default fetchJsonp
