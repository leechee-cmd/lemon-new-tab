import { hashSyncCode, isValidSyncCode } from '../../lib/words'

interface Env {
  SYNC_KV: KVNamespace
}

const MAX_PAYLOAD_BYTES = 1_000_000

interface PushBody {
  code?: string
  /** 客户端最后一次已知的云端时间戳（乐观并发基线） */
  base?: number
  settings?: unknown
  quickLinks?: unknown
  customSearchEngines?: unknown
  updatedAt?: number
}

/** 递归剔除危险键，避免 __proto__ / constructor / prototype 原型污染。 */
function stripDangerousKeys(value: unknown, depth = 0): unknown {
  if (depth > 6) return value
  if (Array.isArray(value)) {
    return value.map((item) => stripDangerousKeys(item, depth + 1))
  }
  if (value != null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
      result[key] = stripDangerousKeys(item, depth + 1)
    }
    return result
  }
  return value
}

/**
 * 上传设置到同步码对应的云端。
 * - 只允许写入「已注册」的键（防止向任意键灌垃圾数据）；
 * - 采用基线校验（base 需等于云端当前时间戳），云端已被他人更新则返回 409；
 * - 请求体大小受限（先查 Content-Length，再读包校验）。
 */
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const declared = Number(request.headers.get('Content-Length') ?? 0)
  if (declared > MAX_PAYLOAD_BYTES) {
    return Response.json({ error: 'too_large' }, { status: 413 })
  }

  const text = await request.text()
  if (text.length > MAX_PAYLOAD_BYTES) {
    return Response.json({ error: 'too_large' }, { status: 413 })
  }

  let body: PushBody
  try {
    body = JSON.parse(text) as PushBody
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { code, base, settings, quickLinks, customSearchEngines, updatedAt } = body
  if (!code || !isValidSyncCode(code)) {
    return Response.json({ error: 'invalid_code' }, { status: 400 })
  }
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) {
    return Response.json({ error: 'invalid_updated_at' }, { status: 400 })
  }
  if (typeof base !== 'number' || !Number.isFinite(base)) {
    return Response.json({ error: 'invalid_base' }, { status: 400 })
  }

  const key = `settings:${await hashSyncCode(code)}`
  const existingRaw = await env.SYNC_KV.get(key)
  if (existingRaw == null) {
    return Response.json({ error: 'not_registered' }, { status: 404 })
  }

  const existing = JSON.parse(existingRaw) as { updatedAt?: number }
  const existingUpdatedAt = typeof existing.updatedAt === 'number' ? existing.updatedAt : 0
  if (base !== existingUpdatedAt) {
    return Response.json({ error: 'conflict' }, { status: 409 })
  }

  await env.SYNC_KV.put(
    key,
    JSON.stringify({
      settings: stripDangerousKeys(settings),
      quickLinks: stripDangerousKeys(quickLinks),
      customSearchEngines: stripDangerousKeys(customSearchEngines),
      updatedAt,
    }),
  )
  return Response.json({ ok: true, updatedAt })
}