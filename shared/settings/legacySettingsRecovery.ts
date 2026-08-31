import { storage } from '#imports'

export async function downloadLegacySettingsBackup() {
  const { downloadJSON } = await import('@/shared/download')

  const settings = await storage.getItem('local:settings')
  const quickLinks = await storage.getItem('local:quickLinks')
  const bookmark = await storage.getItem('local:bookmark')
  const customSearchEngine = await storage.getItem('local:customSearchEngine')

  downloadJSON(
    { settings, quickLinks, bookmark, customSearchEngine },
    `lemon-new-tab-backup-${new Date().toISOString()}.json`,
  )
}

/** 清除本地持久化数据。Web 端无云同步，仅清理本地存储与缓存。 */
export async function clearExtensionData(options?: { includeSync?: boolean }) {
  void options
  const { idbClearAll } = await import('@/shared/storage/idb')

  const tasks = [
    localStorage.clear(),
    sessionStorage.clear(),
    idbClearAll(),
    storage.clear('local'),
    storage.clear('session'),
  ]
  await Promise.all(tasks)
}

/** Web 端只存在当前标签页，重载行为由调用方以 location.reload() 兜底。 */
export async function reloadNewtabTabs(): Promise<boolean> {
  return false
}
