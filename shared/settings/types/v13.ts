import type { SettingsSchemaV12 } from './v12'

/**
 * v13：纯 Web 版。移除 Bing 壁纸（Web 端受 CORS 限制无法取图）：
 * - `background.bing` 字段
 * - `bgType` 的 Bing 选项（由 `BgType` 收敛为 true/false 枚举）
 */
export interface SettingsSchemaV13 extends Omit<SettingsSchemaV12, 'version' | 'background'> {
  background: Omit<SettingsSchemaV12['background'], 'bing'> & {
    online: Omit<
      SettingsSchemaV12['background']['online'],
      'source' | 'lastAutoRefresh' | 'autoRefresh'
    > & {
      /** 在线壁纸来源：预设图源或自定义 URL */
      source: 'picsum' | 'peapix' | 'custom'
      /** 最近一次自动刷新时间戳（毫秒，0 表示尚未自动刷新过） */
      lastAutoRefresh: number
      /** 自动定时更换在线壁纸 */
      autoRefresh: boolean
      /** 上一张在线壁纸 URL（用于自动/手动切换后挽回） */
      previousUrl: string
    }
  }

  version: 13
}
