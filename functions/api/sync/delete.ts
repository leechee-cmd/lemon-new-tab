import { hashSyncCode, isValidSyncCode } from '../../lib/words'

interface Env {
  SYNC_KV: KVNamespace
}

/**
 * 删除同步码对应的云端数据（幂等）。
 * 仅用于用户主动「移除同步码并清理云端」；对不存在的键删除是空操作。
 */
export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  const body = (await request.json().catch(() => null)) as { code?: string } | null
  const code = body?.code ?? ''
  if (!isValidSyncCode(code)) {
    return Response.json({ error: 'invalid_code' }, { status: 400 })
  }

  const key = `settings:${await hashSyncCode(code)}`
  await env.SYNC_KV.delete(key)
  return Response.json({ ok: true })
}