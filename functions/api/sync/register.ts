import { hashSyncCode, pickSyncCode } from '../../lib/words'

interface Env {
  SYNC_KV: KVNamespace
}

/**
 * 生成新的同步码：服务端挑选 10 个随机单词，仅存其 SHA-256 到 KV。
 * 同步码仅此一次返回，丢失无法找回。
 */
export const onRequestPost: PagesFunction<Env> = async ({ env }) => {
  // 键冲突概率极低，少量重试即可
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = pickSyncCode()
    const key = `settings:${await hashSyncCode(code)}`
    const existing = await env.SYNC_KV.get(key)
    if (existing != null) continue
    // 占位键带 TTL：未真正上传前自动过期，避免被恶意批量注册占满 KV
    await env.SYNC_KV.put(key, JSON.stringify({ updatedAt: 0 }), {
      expirationTtl: 48 * 60 * 60,
    })
    return Response.json({ code })
  }
  return Response.json({ error: 'retry_later' }, { status: 503 })
}