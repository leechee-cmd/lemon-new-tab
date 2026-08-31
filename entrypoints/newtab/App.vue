<script lang="ts" setup>
import { useIdle } from '@vueuse/core'
import { type StyleValue } from 'vue'
import { useTranslation } from 'i18next-vue'

import { BgType } from '@/shared/enums'
import { useLanModeStore } from '@/shared/quickLinks'
import { defaultSettings, useSettingsStore } from '@/shared/settings'

import {
  FOCUS_STATE,
  OPEN_BACKGROUND_PREFERENCE,
  OPEN_SEARCH_ENGINE_PREFERENCE,
  OPEN_SETTINGS,
} from '@newtab/shared/keys'
import { isOnlyTouchDevice } from '@newtab/shared/touch'
import {
  isOnlineWallpaperAutoRefreshDue,
  refreshOnlineWallpaper,
} from '@newtab/shared/wallpaper/onlineRefresh'

import DownloadBgBtn from './components/ActionBtn/DownloadBgBtn.vue'
import LanModeBtn from './components/ActionBtn/LanModeBtn.vue'
import RefreshBgBtn from './components/ActionBtn/RefreshBgBtn.vue'
import SettingsBtn from './components/ActionBtn/SettingsBtn.vue'
import Background from './components/Background.vue'
import Clock from './components/Clock.vue'
import Dock from './components/QuickLinks/Dock.vue'
import QuickLinks from './components/QuickLinks/index.vue'
import SearchBox from './components/SearchBox/index.vue'
import YiYan from './components/YiYan.vue'
import { useAppNotifications } from './composables/useAppNotifications'
import { useElementLang } from './composables/useElementLang'
import { createFocusState } from './composables/useFocus'
import {
  AboutComp,
  AddQuickLinkDialog,
  BackgroundSwitcher,
  Changelog,
  Faq,
  SearchEnginesSwitcher,
  SettingsPage,
  useLazyAppComponents,
} from './composables/useLazyAppComponents'
import { useQuickLinksBootstrap } from './composables/useQuickLinksBootstrap'
import { useThemeWatcher } from './composables/useThemeWatcher'

const BackgroundRef = ref<InstanceType<typeof Background>>()
const QuickLinksRef = ref<InstanceType<typeof QuickLinks>>()
const DockRef = ref<InstanceType<typeof Dock>>()
const { t } = useTranslation()

async function handleRefreshBackground() {
  try {
    const result = await refreshOnlineWallpaper()
    // 'applied'：已更新 online.url，Background 会监听变化自动重载背景。
    if (result === 'reload') BackgroundRef.value?.refreshBackground()
  } catch (error) {
    console.error('[background] Failed to refresh online wallpaper:', error)
    BackgroundRef.value?.refreshBackground()
  }
}

let autoRefreshTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  const tick = () => {
    if (!isOnlineWallpaperAutoRefreshDue()) return
    void handleRefreshBackground()
  }
  tick()
  autoRefreshTimer = setInterval(tick, 60_000)
})
onBeforeUnmount(() => {
  if (autoRefreshTimer) clearInterval(autoRefreshTimer)
})
const {
  settingsPageMounted,
  settingsPageVisible,
  changelogMounted,
  changelogVisible,
  faqMounted,
  faqVisible,
  aboutMounted,
  aboutVisible,
  searchEnginesSwitcherMounted,
  searchEnginesSwitcherVisible,
  backgroundSwitcherMounted,
  backgroundSwitcherVisible,
  addQuickLinkDialogMounted,
  addQuickLinkDialogVisible,
  quickLinkDialogRequest,
  toggleSettingsPage,
  showChangelog,
  showFaq,
  toggleAbout,
  showSearchEnginesSwitcher,
  showBackgroundSwitcher,
  openAddQuickLinkDialog,
  openEditQuickLinkDialog,
} = useLazyAppComponents()

const elLocale = useElementLang()
const settings = useSettingsStore()
const { quickLinksReady } = useQuickLinksBootstrap()
const minimalMode = ref(false)

// 主题/外观 watcher
useThemeWatcher()

// 内网链接智能选择：初始化连接方式并按配置探测（仅 auto 模式探测，force 模式跳过）
const lanMode = useLanModeStore()
void lanMode.init().then(() => {
  if (settings.probeUrl?.trim() && lanMode.mode === 'auto') void lanMode.probeOnce()
})
watch(
  () => settings.probeUrl,
  (probeUrl) => {
    if (probeUrl?.trim() && lanMode.mode === 'auto') void lanMode.probeOnce()
  },
)

const { idle } = useIdle(5_000, {
  events: ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel'],
  listenForVisibilityChange: false,
})

const idleHideEnabled = computed(() => settings.theme.idleHide && !isOnlyTouchDevice.value)
const idleActive = computed(() => idleHideEnabled.value && idle.value && !minimalMode.value)
const keepClockVisibleOnIdle = computed(
  () => idleActive.value && settings.theme.keepClockVisibleOnIdle,
)
const idleMainStyle = computed<StyleValue>(() =>
  idleActive.value && !keepClockVisibleOnIdle.value ? { opacity: 0.2 } : undefined,
)
const contentStyle = computed<StyleValue>(() =>
  keepClockVisibleOnIdle.value ? { opacity: 0.2 } : undefined,
)

watch(
  isOnlyTouchDevice,
  (onlyTouch) => {
    if (!onlyTouch) return
    settings.background.parallax = false
    settings.theme.idleHide = false
  },
  { immediate: true },
)

watch(
  () => settings.layout.minimalModeOnDoubleClick,
  (enabled) => {
    if (!enabled) minimalMode.value = false
  },
)

provide(FOCUS_STATE, createFocusState())
provide(OPEN_SETTINGS, toggleSettingsPage)
provide(OPEN_SEARCH_ENGINE_PREFERENCE, showSearchEnginesSwitcher)
provide(OPEN_BACKGROUND_PREFERENCE, showBackgroundSwitcher)

// 应用级通知（欢迎、缓存提示、版本更新）
useAppNotifications(showChangelog)

// Dock 占用底部空间时，将操作按钮位置同步为对应的顶部位置，保证渲染与持久化设置一致。
watch(
  [() => settings.dock.enabled, () => settings.layout.actionBtnPosition],
  ([dockEnabled, actionBtnPosition]) => {
    if (!dockEnabled || !actionBtnPosition.startsWith('bottom')) return
    settings.layout.actionBtnPosition = actionBtnPosition.replace(
      'bottom',
      'top',
    ) as typeof actionBtnPosition
  },
  { immediate: true },
)

const actionClass = computed(() => {
  const perf = settings.perf
  const enableTransparent = perf.actionBtns.transparent && perf.actionBtns.transparency > 0
  const enableBlur = perf.actionBtns.blur && enableTransparent

  return {
    'action-btn-container--tran': enableTransparent,
    'action-btn-container--blur': enableBlur,
    [`action-btn-container--${settings.layout.actionBtnPosition}`]: true,
  }
})

const quickLinksScrollEnabled = computed(
  () => settings.quickLinks.enabled && settings.quickLinks.useScroll,
)

watch(
  quickLinksScrollEnabled,
  (enabled) => {
    if (!enabled || settings.layout.mainPosition.type !== 'center') return
    settings.layout.mainPosition = {
      type: 'dvh',
      value: defaultSettings.layout.mainPosition.value,
    }
  },
  { immediate: true },
)

const mainClass = computed(() => ({
  'app--quick-links-scroll': quickLinksScrollEnabled.value,
  'app--minimal': minimalMode.value,
}))

const mainStyle = computed<StyleValue>(() => {
  if (quickLinksScrollEnabled.value && settings.layout.mainPosition.type === 'center') {
    return [
      { paddingTop: `${defaultSettings.layout.mainPosition.value}vh` },
      { paddingTop: `${defaultSettings.layout.mainPosition.value}dvh` },
    ]
  }

  const pos = settings.layout.mainPosition
  if (pos.type === 'center') {
    return { justifyContent: 'center' }
  }
  if (pos.type === 'dvh') {
    return [{ paddingTop: `${pos.value}vh` }, { paddingTop: `${pos.value}dvh` }]
  }
  return { paddingTop: `${pos.value}px` }
})

async function refreshQuickLinks() {
  await Promise.all([QuickLinksRef.value?.refresh(), DockRef.value?.refresh()])
}

function toggleMinimalMode() {
  if (!settings.layout.minimalModeOnDoubleClick) return
  minimalMode.value = !minimalMode.value
}
</script>

<template>
  <el-config-provider
    :locale="elLocale"
    :dialog="{
      transition: settings.perf.dialog.animation ? 'dialog' : 'none',
      alignCenter: true,
    }"
    :message="{
      placement: settings.dock.enabled ? 'top' : 'bottom',
    }"
  >
    <main
      :style="[mainStyle, idleMainStyle]"
      class="app"
      :class="mainClass"
      :aria-label="t('a11y.main')"
      @dblclick.self="toggleMinimalMode"
    >
      <clock v-if="settings.clock.enabled" @contextmenu.stop />
      <div
        class="app__content"
        :style="contentStyle"
        :inert="minimalMode || undefined"
        @dblclick.self="toggleMinimalMode"
      >
        <search-box v-if="settings.search.enabled" @contextmenu.stop />
        <quick-links
          v-if="settings.quickLinks.enabled"
          ref="QuickLinksRef"
          :ready="quickLinksReady"
          :on-open-add-dialog="openAddQuickLinkDialog"
          :on-open-edit-dialog="openEditQuickLinkDialog"
          @contextmenu.stop
        />
        <yi-yan v-if="settings.yiyan.enabled" @contextmenu.stop />
        <dock
          v-if="settings.dock.enabled"
          ref="DockRef"
          :ready="quickLinksReady"
          :on-open-add-dialog="openAddQuickLinkDialog"
          :on-open-edit-dialog="openEditQuickLinkDialog"
        />
      </div>
    </main>
    <background ref="BackgroundRef" />
    <div
      class="action-btn-container"
      :class="actionClass"
      role="toolbar"
      :aria-label="t('a11y.actions')"
    >
      <settings-btn
        @open-settings="toggleSettingsPage"
        @open-changelog="showChangelog"
        @open-about="toggleAbout"
        @open-search-engine-preference="showSearchEnginesSwitcher"
        @open-faq="showFaq"
        @open-background-switcher="showBackgroundSwitcher"
      />
      <lan-mode-btn v-if="settings.lanModeEnabled" v-show="!minimalMode" />
      <refresh-bg-btn
        v-if="settings.background.bgType === BgType.Online"
        v-show="!minimalMode"
        @refresh-background="handleRefreshBackground"
      ></refresh-bg-btn>
      <download-bg-btn
        v-if="settings.background.showDownloadBtn && settings.background.bgType === BgType.Online"
        v-show="!minimalMode"
      ></download-bg-btn>
    </div>
    <settings-page v-if="settingsPageMounted" v-model="settingsPageVisible" />
    <changelog v-if="changelogMounted" v-model="changelogVisible" />
    <faq v-if="faqMounted" v-model="faqVisible" />
    <about-comp v-if="aboutMounted" v-model="aboutVisible" />
    <search-engines-switcher
      v-if="searchEnginesSwitcherMounted"
      v-model="searchEnginesSwitcherVisible"
    />
    <background-switcher v-if="backgroundSwitcherMounted" v-model="backgroundSwitcherVisible" />
    <add-quick-link-dialog
      v-if="addQuickLinkDialogMounted"
      v-model="addQuickLinkDialogVisible"
      :request="quickLinkDialogRequest"
      @saved="refreshQuickLinks"
    />
  </el-config-provider>
</template>
