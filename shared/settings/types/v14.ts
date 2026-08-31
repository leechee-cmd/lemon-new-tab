import type { SettingsSchemaV13 } from './v13'

/**
 * v14：移除莫奈取色（`theme.monetColor`）。
 * 该功能在纯 Web 端受浏览器 canvas 跨域限制，在线壁纸无法可靠取色，故整体移除，
 * 主题色改为始终使用用户固定的 `primaryColor`。
 */
export interface SettingsSchemaV14 extends Omit<SettingsSchemaV13, 'version' | 'theme'> {
  theme: Omit<SettingsSchemaV13['theme'], 'monetColor'>

  version: 14
}
