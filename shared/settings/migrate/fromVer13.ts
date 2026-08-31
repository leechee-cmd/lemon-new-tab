import type { SettingsSchemaV13, SettingsSchemaV14 } from '../types'

export function migrateFromVer13To14(old: SettingsSchemaV13): SettingsSchemaV14 {
  const { monetColor, ...theme } = old.theme
  void monetColor

  return {
    ...old,
    theme,
    version: 14,
  } satisfies SettingsSchemaV14
}
