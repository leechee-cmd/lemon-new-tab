import type { SettingsSchemaV11, SettingsSchemaV12 } from '../types'

export function migrateFromVer11To12(old: SettingsSchemaV11): SettingsSchemaV12 {
  const { bookmark, sync, perf, ...rest } = old
  const { bookmark: bookmarkPerf, ...perfRest } = perf
  const { topSites: quickLinkTopSites, ...quickLinks } = old.quickLinks
  const { topSites: dockTopSites, launchpad, ...dockRest } = old.dock
  const { topSites: launchpadTopSites, ...launchpadRest } = launchpad

  void bookmark
  void sync
  void bookmarkPerf
  void quickLinkTopSites
  void dockTopSites
  void launchpadTopSites

  return {
    ...rest,
    quickLinks,
    dock: {
      ...dockRest,
      launchpad: launchpadRest,
    },
    perf: perfRest,
    version: 12,
  } satisfies SettingsSchemaV12
}
