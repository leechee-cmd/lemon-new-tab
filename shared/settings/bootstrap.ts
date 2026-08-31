import { storage } from '#imports'

export async function isSettingsCompatible(): Promise<boolean> {
  const stored$ = await storage.getItem<number | null>('local:$settings', { fallback: null })
  const storedSettings = (await storage.getItem<{
    version: string | number | null
  } | null>('local:settings', { fallback: null })) ?? { version: null }

  if (stored$ && stored$ <= 6) {
    return false
  }

  if (storedSettings.version) {
    let isInvaildSettings: boolean = false

    if (typeof storedSettings.version === 'string') {
      // 远古配置文件
      isInvaildSettings = true
    } else if (storedSettings.version <= 6) {
      isInvaildSettings = true
    }
    if (!('pluginVersion' in storedSettings)) {
      // 早期版本没有 pluginVersion 字段，说明配置文件非常古老，直接清除重置
      isInvaildSettings = true
    }

    if (isInvaildSettings) {
      return false
    }
  }

  return true
}

export async function shouldStartApp(): Promise<boolean> {
  if (await isSettingsCompatible()) return true

  const { handleInvaildSettings } = await import('./handleInvaild')
  await handleInvaildSettings()
  return false
}
