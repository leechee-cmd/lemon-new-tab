import { type QuickLinksData, useQuickLinksStore } from '@/shared/quickLinks'
import {
  type CURRENT_CONFIG_SCHEMA,
  normalizeCurrentSettings,
  useSettingsStore,
} from '@/shared/settings'
import { ensureSearchEngineAvailable } from '@/shared/searchEngines'
import i18next from 'i18next'

import {
  type CustomSearchEngineStorage,
  useCustomSearchEngineStore,
} from '@newtab/shared/customSearchEngine'

/** 云端同步的数据结构。 */
export interface SyncBackup {
  settings: CURRENT_CONFIG_SCHEMA
  quickLinks: QuickLinksData
  customSearchEngines: CustomSearchEngineStorage
  /** 当前界面语言（i18next 单独存储，需显式纳入同步） */
  language: string
}

/** 收集当前设置快照。 */
export function buildSyncBackup(): SyncBackup {
  const settings = useSettingsStore()
  const quickLinks = useQuickLinksStore()
  const customSearchEngineStore = useCustomSearchEngineStore()

  return {
    settings: settings.$state,
    quickLinks: quickLinks.getSnapshot(),
    customSearchEngines: customSearchEngineStore.$state,
    language: i18next.language || navigator.language,
  }
}

/**
 * 应用云端设置。
 * - 本机壁纸文件 / blob 是设备私有，保留本机；
 * - 在线壁纸地址（url / previousUrl / source）随云端同步；
 * - 语言随云端同步。
 */
export async function applySyncBackup(data: SyncBackup): Promise<void> {
  const settings = useSettingsStore()
  const quickLinks = useQuickLinksStore()
  const customSearchEngineStore = useCustomSearchEngineStore()

  if (settings.version !== data.settings.version) {
    throw new Error('VERSION_MISMATCH')
  }

  const next = { ...data.settings }
  // 本机壁纸文件 / blob（local 与 localDark）是设备私有：id 指向本机 IndexedDB，
  // 云端值在目标设备上解析不到，故一律保留本机当前壁纸。
  // online（url / previousUrl / source 等）整体随云端同步。
  next.background = {
    ...next.background,
    local: { ...settings.$state.background.local },
    localDark: { ...settings.$state.background.localDark },
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

  // 立即持久化设置，避免依赖防抖保存导致「下载后马上关页」丢失
  await settings.save()

  if (data.language) {
    await i18next.changeLanguage(data.language)
  }
}