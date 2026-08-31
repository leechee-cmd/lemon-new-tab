import { BgType } from '@/shared/enums'

import type { SettingsSchemaV12, SettingsSchemaV13 } from '../types'

export function migrateFromVer12To13(old: SettingsSchemaV12): SettingsSchemaV13 {
  const { bing, ...background } = old.background
  void bing

  // Bing 已移除，此前设为 Bing 的用户回退到无背景，避免遗漏背景类型。
  const bgType: SettingsSchemaV13['background']['bgType'] =
    (old.background.bgType as string) === 'bing' ? BgType.None : old.background.bgType

  return {
    ...old,
    background: {
      ...background,
      bgType,
      online: {
        ...background.online,
        // v13 新增：在线壁纸来源与自动刷新。
        source: 'custom',
        lastAutoRefresh: 0,
        autoRefresh: true,
        previousUrl: '',
      },
    },
    version: 13,
  } satisfies SettingsSchemaV13
}
