import type { SettingsSchemaV11 } from './v11'

/**
 * v12：纯 Web 版。移除仅扩展可用的能力及其设置项：
 * - 书签侧边栏 `bookmark` 与 `perf.bookmark`
 * - 最常访问 `quickLinks.topSites` / `dock.topSites` / `dock.launchpad.topSites`
 * - 云同步 `sync`
 */
export interface SettingsSchemaV12 extends Omit<
  SettingsSchemaV11,
  'version' | 'quickLinks' | 'dock' | 'perf' | 'bookmark' | 'sync'
> {
  quickLinks: Omit<SettingsSchemaV11['quickLinks'], 'topSites'>

  dock: Omit<SettingsSchemaV11['dock'], 'topSites' | 'launchpad'> & {
    launchpad: Omit<SettingsSchemaV11['dock']['launchpad'], 'topSites'>
  }

  perf: Omit<SettingsSchemaV11['perf'], 'bookmark'>

  version: 12
}
