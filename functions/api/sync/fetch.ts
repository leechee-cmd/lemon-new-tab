import { hashSyncCode, isValidSyncCode } from '../../lib/words'

interface Env {
  SYNC_KV: KVNamespace
}

/**
 * 拉取同步码对应的云端设置。
 * 仅能读取已注册的键；未注册/未知的码一律 404，不区分具体原因。
 */
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const body = (await request.json().catch(() => null)) as { code?: string } | null
  const code = body?.code ?? ''
  if (!isValidSyncCode(code)) {
    return Response.json({ error: 'invalid_code' }, { status: 400 })
  }

  const key = `settings:${await hashSyncCode(code)}`
  const raw = await env.SYNC_KV.get(key)
  if (raw == null) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }
  return Response.json(JSON.parse(raw))
}