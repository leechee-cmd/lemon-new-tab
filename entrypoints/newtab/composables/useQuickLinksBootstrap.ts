import { useQuickLinksStore } from '@/shared/quickLinks'
import { useSettingsStore } from '@/shared/settings'

export function useQuickLinksBootstrap() {
  const settings = useSettingsStore()
  const quickLinksStore = useQuickLinksStore()
  const quickLinksReady = ref(false)
  let initTask: Promise<void> | null = null

  const initialize = async () => {
    if (quickLinksReady.value) return
    if (initTask) return await initTask

    initTask = (async () => {
      await quickLinksStore.init()
      if (settings.quickLinks.grouping) {
        await quickLinksStore.enableGroupingFromItems()
      }
      quickLinksReady.value = true
    })()

    try {
      await initTask
    } finally {
      initTask = null
    }
  }

  watch(
    () => settings.quickLinks.enabled || settings.dock.enabled,
    (enabled) => {
      if (!enabled) return
      void initialize().catch((error) => {
        console.error('[quick-links] Failed to initialize:', error)
      })
    },
    { immediate: true },
  )

  return { quickLinksReady: readonly(quickLinksReady) }
}
