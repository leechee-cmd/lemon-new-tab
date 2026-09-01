import { type QuickLinksData, useQuickLinksStore } from '@/shared/quickLinks'
import {
  type CURRENT_CONFIG_SCHEMA,
  normalizeCurrentSettings,
  useSettingsStore,
} from '@/shared/settings'
import { ensureSearchEngineAvailable } from '@/shared/searchEngines'

import {
  type CustomSearchEngineStorage,
  useCustomSearchEngineStore,
} from '@newtab/shared/customSearchEngine'

/** 云端同步的数据结构，与「导出/导入备份」保持一致。 */
export interface SyncBackup {
  settings: CURRENT_CONFIG_SCHEMA
  quickLinks: QuickLinksData
  customSearchEngines: CustomSearchEngineStorage
}

/** 收集当前设置快照（与导出备份使用同一数据源）。 */
export function buildSyncBackup(): SyncBackup {
  const settings = useSettingsStore()
  const quickLinks = useQuickLinksStore()
  const customSearchEngineStore = useCustomSearchEngineStore()

  return {
    settings: settings.$state,
    quickLinks: quickLinks.getSnapshot(),
    customSearchEngines: customSearchEngineStore.$state,
  }
}

/** 应用云端设置（与导入备份的处理逻辑一致：壁纸文件保留在本机）。 */
export async function applySyncBackup(data: SyncBackup): Promise<void> {
  const settings = useSettingsStore()
  const quickLinks = useQuickLinksStore()
  const customSearchEngineStore = useCustomSearchEngineStore()

  if (settings.version !== data.settings.version) {
    throw new Error('VERSION_MISMATCH')
  }

  const next = { ...data.settings }
  // 本机壁纸文件 / blob 是设备私有，不同步：保留本机当前亮色壁纸与在线地址。
  // localDark 沿用导入逻辑：有云端值则采用，缺失时给空值。
  next.background = {
    ...next.background,
    local: { ...settings.$state.background.local },
    localDark: next.background.localDark
      ? { ...next.background.localDark }
      : { id: '', url: '', mediaType: undefined },
    online: {
      ...next.background.online,
      url: settings.$state.background.online.url,
    },
  }

  const importedSettings = normalizeCurrentSettings(next)
  settings.$patch(importedSettings)

  if (data.quickLinks) {
    await quickLinks.save(data.quickLinks, { groupingEnabled: settings.quickLinks.grouping })
  }

  if (data.customSearchEngines) {
    await customSearchEngineStore.save(data.customSearchEngines)
  }

  ensureSearchEngineAvailable(
    settings.search,
    customSearchEngineStore.items.map((engine) => engine.id),
  )
}