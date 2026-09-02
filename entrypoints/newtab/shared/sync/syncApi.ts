export class SyncApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'SyncApiError'
    this.status = status
  }
}

export interface SyncRemoteData {
  settings?: unknown
  quickLinks?: unknown
  customSearchEngines?: unknown
  language?: string
  updatedAt: number
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api/sync/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new SyncApiError('network_error', 0)
  }

  const data = (await res.json().catch(() => null)) as T | null
  if (!res.ok) {
    const code = (data as { error?: string } | null)?.error ?? `HTTP ${res.status}`
    throw new SyncApiError(code, res.status)
  }
  return data as T
}

export function registerSyncCode(): Promise<{ code: string }> {
  return post('register', {})
}

export function fetchRemoteData(code: string): Promise<SyncRemoteData> {
  return post('fetch', { code })
}

export function pushRemoteData(
  code: string,
  data: Omit<SyncRemoteData, 'updatedAt'>,
  base: number,
  updatedAt: number,
): Promise<{ ok: true; updatedAt: number }> {
  return post('push', { code, ...data, base, updatedAt })
}

export function deleteRemoteData(code: string): Promise<{ ok: true }> {
  return post('delete', { code })
}