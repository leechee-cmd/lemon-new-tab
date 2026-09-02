/**
 * 客户端设置 Schema 当前版本号。
 * 必须与 shared/settings/current.ts 的 CURRENT_CONFIG_VERSION 保持一致，
 * 升级 Schema 版本时需同步更新此处，否则旧版客户端可能覆盖新版云端数据。
 */
export const CURRENT_SETTINGS_VERSION = 14