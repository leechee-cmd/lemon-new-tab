import { storage } from '#imports'

export interface SyncState {
  /** 同步码（10 个随机单词）。只存本机，绝不进入云端同步的设置体。 */
  code: string
  /** 上次成功上传/下载的服务器时间戳 */
  updatedAt: number
}

export const syncStateItem = storage.defineItem<SyncState>('local:syncState', {
  fallback: { code: '', updatedAt: 0 },
})

export async function getSyncState(): Promise<SyncState> {
  return syncStateItem.getValue()
}

export async function setSyncState(state: SyncState): Promise<void> {
  await syncStateItem.setValue(state)
}

export async function clearSyncState(): Promise<void> {
  await syncStateItem.setValue({ code: '', updatedAt: 0 })
}