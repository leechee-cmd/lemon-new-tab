<script setup lang="ts">
import './bg-switcher.scss'
import { storeToRefs } from 'pinia'

import type { UploadRequestOptions } from 'element-plus'
import { useTranslation } from 'i18next-vue'
import CloseRound from '~icons/ic/round-close'
import UploadRound from '~icons/ic/round-upload'
import CloudQueueTwotone from '~icons/ic/twotone-cloud-queue'

import { BgType } from '@/shared/enums'
import { useSettingsStore } from '@/shared/settings'

import BaseDialog from '@newtab/components/BaseDialog.vue'
import { useWallpaperUrlStore } from '@newtab/shared/wallpaper'
import { fetchOnlineSourceUrl } from '@newtab/shared/wallpaper/onlineSource'

import useBackgroundSwitcher from './useBackgroundSwitcher'

const { t } = useTranslation('settings')

const requestedVisible = defineModel<boolean>({ required: true })
const opened = ref(false)

const settings = useSettingsStore()
const wallpaperUrlStore = useWallpaperUrlStore()
const { lightUrl: localBgUrl, darkUrl: localDarkBgUrl, onlineUrl } = storeToRefs(wallpaperUrlStore)

const {
  isDarkBg,
  metaLight,
  metaDark,
  formatBytes,
  beforeBackgroundUpload,
  handleUpload,
  deleteLocalBg,
  tempOnlineUrl,
  changeOnlineBg,
} = useBackgroundSwitcher()

type TabKey = 'online' | 'link' | 'local'
const activeTab = ref<TabKey>('online')
const previewLoading = ref(false)

const selectedSource = computed<'picsum' | 'peapix'>(() =>
  settings.background.online.source === 'peapix' ? 'peapix' : 'picsum',
)

const isShowDeleteIcon = computed(() =>
  Boolean(isDarkBg.value ? settings.background.localDark.id : settings.background.local.id),
)

const previewSrc = computed(() => {
  if (activeTab.value === 'local') {
    return isDarkBg.value ? localDarkBgUrl.value : localBgUrl.value
  }
  return onlineUrl.value || settings.background.online.url
})

async function applyOnlineSource(source: 'picsum' | 'peapix') {
  previewLoading.value = true
  try {
    const url = await fetchOnlineSourceUrl(source)
    if (!url) throw new Error('Empty online wallpaper URL')

    const previousUrl = settings.background.online.url
    // 换新图前记录上一张，便于切换后挽回。
    if (previousUrl && previousUrl !== url) settings.background.online.previousUrl = previousUrl
    settings.background.online.source = source
    settings.background.online.url = url
    settings.background.online.lastAutoRefresh = Date.now()
    settings.background.bgType = BgType.Online

    // 等待统一 store 解析/缓存新图（只发一次网络请求）
    await wallpaperUrlStore.getOnlineUrl(url)
  } catch (error) {
    console.error('[background] Failed to apply online wallpaper:', error)
    ElMessage.error(t('background.preset.fetchFailed'))
  } finally {
    previewLoading.value = false
  }
}

async function restorePrevious() {
  const online = settings.background.online
  if (!online.previousUrl) return
  previewLoading.value = true
  try {
    const prev = online.previousUrl
    online.previousUrl = online.url
    online.url = prev
    online.lastAutoRefresh = Date.now()
    settings.background.bgType = BgType.Online
    await wallpaperUrlStore.getOnlineUrl(prev)
  } catch (error) {
    console.error('[background] Failed to restore previous online wallpaper:', error)
  } finally {
    previewLoading.value = false
  }
}

function chooseSource(source: 'picsum' | 'peapix') {
  void applyOnlineSource(source)
  if (activeTab.value === 'link') activeTab.value = 'online'
}

function swapPreview() {
  void applyOnlineSource(selectedSource.value)
}

function switchTab(tab: TabKey) {
  activeTab.value = tab
}

watch(
  requestedVisible,
  (visible) => {
    if (!visible) {
      opened.value = false
      return
    }
    const online = settings.background.online
    activeTab.value =
      settings.background.bgType === BgType.Local
        ? 'local'
        : online.source === 'custom'
          ? 'link'
          : 'online'
    if (online.source === 'custom') tempOnlineUrl.value = online.url
    if (settings.background.bgType === BgType.Online && online.url && !onlineUrl.value) {
      void wallpaperUrlStore.getOnlineUrl(online.url)
    }
    opened.value = true
  },
  { immediate: true },
)

watch(opened, (visible) => {
  if (!visible && requestedVisible.value) requestedVisible.value = false
})
</script>

<template>
  <base-dialog v-model="opened" container-class="bg-switcher__dialog" :show-close="false">
    <div class="bg-switcher">
      <div class="bg-switcher__header">
        <div class="bg-switcher__title">{{ t('background.preferenceTitle') }}</div>
        <div class="bg-switcher__subtitle">{{ t('background.preferenceSubtitle') }}</div>
      </div>

      <div class="bg-switcher__preview">
        <template v-if="activeTab === 'local'">
          <el-upload
            class="bg-switcher-preview-upload"
            :show-file-list="false"
            :http-request="(option: UploadRequestOptions) => handleUpload(option)"
            :before-upload="beforeBackgroundUpload"
            accept="image/*,video/*"
          >
            <img v-if="previewSrc" :src="previewSrc" alt="" />
            <div v-else class="bg-switcher__preview-placeholder">
              <el-icon><upload-round /></el-icon>
            </div>
          </el-upload>
          <button
            v-if="isShowDeleteIcon"
            type="button"
            class="bg-switcher-preview-delete"
            :aria-label="t('newtab:common.delete')"
            @click="deleteLocalBg"
          >
            <el-icon><close-round /></el-icon>
          </button>
        </template>
        <template v-else>
          <img v-if="previewSrc" :src="previewSrc" alt="" />
          <div v-else class="bg-switcher__preview-placeholder">
            <el-icon><cloud-queue-twotone /></el-icon>
          </div>
        </template>

        <button
          v-if="activeTab === 'online' && settings.background.online.previousUrl"
          type="button"
          class="bg-switcher__preview-action bg-switcher__preview-action--restore"
          @click="restorePrevious"
        >
          {{ t('background.restorePrevious') }}
        </button>
        <button
          v-if="activeTab === 'online'"
          type="button"
          class="bg-switcher__preview-action"
          :disabled="previewLoading"
          @click="swapPreview"
        >
          <el-icon><svg viewBox="0 0 24 24"><path
            fill="currentColor"
            d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8a6.05 6.05 0 0 1-.7-2.8c0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"
          /></svg></el-icon>
          {{ t('background.swap') }}
        </button>
      </div>

      <div class="bg-switcher__tabs">
        <button
          type="button"
          class="bg-switcher__tab"
          :class="{ 'bg-switcher__tab--active': activeTab === 'online' }"
          @click="switchTab('online')"
        >
          {{ t('background.tab.curated') }}
        </button>
        <button
          type="button"
          class="bg-switcher__tab"
          :class="{ 'bg-switcher__tab--active': activeTab === 'link' }"
          @click="switchTab('link')"
        >
          {{ t('background.tab.link') }}
        </button>
        <button
          type="button"
          class="bg-switcher__tab"
          :class="{ 'bg-switcher__tab--active': activeTab === 'local' }"
          @click="switchTab('local')"
        >
          {{ t('background.tab.local') }}
        </button>
      </div>

      <!-- 在线精选 -->
      <div v-if="activeTab === 'online'" class="bg-switcher__presets">
        <button
          type="button"
          class="bg-switcher__preset"
          :class="{ 'bg-switcher__preset--active': selectedSource === 'picsum' }"
          :disabled="previewLoading"
          @click="chooseSource('picsum')"
        >
          <span class="bg-switcher__preset-name">{{ t('background.preset.picsum') }}</span>
          <span class="bg-switcher__preset-desc">{{ t('background.preset.picsumDesc') }}</span>
        </button>
        <button
          type="button"
          class="bg-switcher__preset"
          :class="{ 'bg-switcher__preset--active': selectedSource === 'peapix' }"
          :disabled="previewLoading"
          @click="chooseSource('peapix')"
        >
          <span class="bg-switcher__preset-name">{{ t('background.preset.peapix') }}</span>
          <span class="bg-switcher__preset-desc">{{ t('background.preset.peapixDesc') }}</span>
        </button>
      </div>

      <!-- 图片链接 -->
      <div v-else-if="activeTab === 'link'" class="bg-switcher__link">
        <el-input
          v-model="tempOnlineUrl"
          :placeholder="t('background.onlinePlaceholder')"
          class="bg-switcher__link-input"
          @blur="changeOnlineBg"
          @keydown.enter="changeOnlineBg"
        >
          <template #prepend>URL</template>
        </el-input>
      </div>

      <!-- 本地上传辅助信息 -->
      <div v-else class="bg-switcher__local-meta">
        <span v-if="metaLight && !isDarkBg">
          {{ metaLight.size ? formatBytes(metaLight.size) : '' }}
          {{ metaLight.width ? `${metaLight.width}×${metaLight.height}` : '' }}
        </span>
        <span v-if="metaDark && isDarkBg">
          {{ metaDark.size ? formatBytes(metaDark.size) : '' }}
          {{ metaDark.width ? `${metaDark.width}×${metaDark.height}` : '' }}
        </span>
      </div>
    </div>
  </base-dialog>
</template>
