<script setup lang="ts">
import { ElCheckbox, ElMessage, ElMessageBox } from 'element-plus'
import { h } from 'vue'
import { useTranslation } from 'i18next-vue'
import CopyRound from '~icons/ic/round-content-copy'
import DeleteForeverOutlined from '~icons/ic/outline-delete-forever'
import DownloadRound from '~icons/ic/round-download'
import FileUploadRound from '~icons/ic/round-file-upload'

import {
  type SyncApiError,
  deleteRemoteData,
  fetchRemoteData,
  pushRemoteData,
  registerSyncCode,
} from '@newtab/shared/sync/syncApi'
import { applySyncBackup, buildSyncBackup, type SyncBackup } from '@newtab/shared/sync/syncBackup'
import {
  clearSyncState,
  getSyncState,
  setSyncState,
  type SyncState,
} from '@newtab/shared/sync/syncStorage'

import SettingsSection from './SettingsSection.vue'

const { t } = useTranslation('settings')

const state = ref<SyncState>({ code: '', updatedAt: 0 })
const loading = ref(false)
const codeInput = ref('')
const newCode = ref('')

const maskedCode = computed(() => {
  const words = state.value.code.split('-')
  if (!words[0]) return ''
  return `${words.slice(0, 2).join('-')} ······`
})

const lastSyncText = computed(() =>
  state.value.updatedAt ? new Date(state.value.updatedAt).toLocaleString() : t('sync.never'),
)

function errorKey(error: unknown): string {
  if (error instanceof Error && error.message === 'VERSION_MISMATCH') return 'versionMismatch'
  const apiError = error as SyncApiError
  if (!apiError || typeof apiError.status !== 'number') return 'networkError'
  if (apiError.status === 0) return 'networkError'
  if (apiError.message === 'invalid_code') return 'invalidCode'
  if (apiError.message === 'not_found') return 'codeNotFound'
  if (apiError.message === 'not_registered') return 'notRegistered'
  if (apiError.message === 'conflict') return 'conflict'
  if (apiError.message === 'stale') return 'stale'
  if (apiError.message === 'too_large') return 'tooLarge'
  if (apiError.message === 'retry_later') return 'retryLater'
  return 'networkError'
}

function showError(error: unknown) {
  ElMessage.error(t(`sync.${errorKey(error)}`))
}

/** 规范化用户输入：转小写、空白转连字符，校验 10 个单词。 */
function normalizeCode(raw: string): string {
  const code = raw.trim().toLowerCase().replace(/\s+/g, '-')
  return /^[a-z]+(?:-[a-z]+){9}$/.test(code) ? code : ''
}

async function generateCode() {
  loading.value = true
  try {
    const { code } = await registerSyncCode()
    newCode.value = code
    state.value = { code, updatedAt: 0 }
    await setSyncState(state.value)
  } catch (error) {
    showError(error)
  } finally {
    loading.value = false
  }
}

async function saveEnteredCode() {
  const code = normalizeCode(codeInput.value)
  if (!code) {
    ElMessage.error(t('sync.invalidCode'))
    return
  }
  loading.value = true
  try {
    // 先用一次拉取确认同步码真实存在，并记下服务器时间戳作为冲突基线
    const data = await fetchRemoteData(code)
    state.value = { code, updatedAt: data.updatedAt }
    await setSyncState(state.value)
    ElMessage.success(t('sync.codeSaved'))
  } catch (error) {
    showError(error)
  } finally {
    loading.value = false
  }
}

async function upload() {
  loading.value = true
  try {
    const backup = buildSyncBackup()
    const updatedAt = Date.now()
    // base = 本机最后一次已知的云端时间戳，云端已被他人更新则返回冲突
    await pushRemoteData(state.value.code, backup, state.value.updatedAt, updatedAt)
    state.value = { ...state.value, updatedAt }
    await setSyncState(state.value)
    ElMessage.success(t('sync.uploadSuccess'))
  } catch (error) {
    showError(error)
  } finally {
    loading.value = false
  }
}

async function download() {
  loading.value = true
  try {
    const data = await fetchRemoteData(state.value.code)
    if (data.updatedAt === 0 || !data.settings) {
      ElMessage.info(t('sync.emptyRemote'))
      return
    }
    await applySyncBackup(data as unknown as SyncBackup)
    state.value = { ...state.value, updatedAt: data.updatedAt }
    await setSyncState(state.value)
    ElMessage.success(t('sync.downloadSuccess'))
  } catch (error) {
    showError(error)
  } finally {
    loading.value = false
  }
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(newCode.value)
    ElMessage.success(t('sync.copied'))
  } catch {
    ElMessage.error(t('sync.copyFailed'))
  }
}

function dismissNewCode() {
  newCode.value = ''
}

const deleteCloud = ref(false)

async function removeCode() {
  deleteCloud.value = false
  try {
    await ElMessageBox.confirm(
      () =>
        h('div', null, [
          h('p', { style: 'margin: 0 0 12px' }, t('sync.removeConfirmMessage')),
          h(
            ElCheckbox,
            {
              modelValue: deleteCloud.value,
              'onUpdate:modelValue': (value) => (deleteCloud.value = value === true),
            },
            () => t('sync.removeDeleteCloud'),
          ),
        ]),
      t('sync.removeConfirmTitle'),
      { type: 'warning' },
    )
  } catch {
    return
  }

  loading.value = true
  try {
    if (deleteCloud.value) await deleteRemoteData(state.value.code)
    await clearSyncState()
    state.value = { code: '', updatedAt: 0 }
    ElMessage.success(t('sync.removed'))
  } catch (error) {
    showError(error)
  } finally {
    loading.value = false
  }
}

onMounted(refreshState)

async function refreshState() {
  state.value = await getSyncState()
}
</script>

<template>
  <div class="settings__items-container settings-page-grid">
    <SettingsSection
      :title="t('sync.title')"
      :summary="t('sync.summary')"
      content-class="settings-control-grid"
      mobile-open
    >
      <template v-if="!state.code">
        <div
          class="settings__item settings__item--horizontal settings__item--with-note settings-control-wide"
        >
          <div class="settings__label">{{ t('sync.generate') }}</div>
          <el-button type="primary" :loading="loading" @click="generateCode">
            {{ t('sync.generate') }}
          </el-button>
          <p class="settings__item-note">{{ t('sync.generateHint') }}</p>
        </div>
        <div
          class="settings__item settings__item--horizontal settings-control-wide settings-control-stackable"
        >
          <div class="settings__label">{{ t('sync.enterCode') }}</div>
          <div class="sync-code-input-row">
            <el-input
              v-model="codeInput"
              :placeholder="t('sync.enterCodePlaceholder')"
              :disabled="loading"
              @keyup.enter="saveEnteredCode"
            />
            <el-button :loading="loading" @click="saveEnteredCode">
              {{ t('sync.saveCode') }}
            </el-button>
          </div>
        </div>
      </template>

      <template v-else>
        <div
          class="settings__item settings__item--horizontal settings__item--with-note settings-control-wide"
        >
          <div class="settings__label">{{ t('sync.codeLabel') }}</div>
          <span class="sync-code-masked">{{ maskedCode }}</span>
          <p class="settings__item-note">{{ t('sync.lastSync') }}：{{ lastSyncText }}</p>
        </div>
        <div class="settings__item settings__item--horizontal settings-control-wide">
          <div class="settings__label">{{ t('sync.syncActions') }}</div>
          <span class="button-group">
            <el-button type="primary" :icon="FileUploadRound" :loading="loading" @click="upload">
              {{ t('sync.upload') }}
            </el-button>
            <el-button :icon="DownloadRound" :loading="loading" @click="download">
              {{ t('sync.download') }}
            </el-button>
          </span>
        </div>
        <div class="settings__item settings__item--horizontal">
          <div class="settings__label">{{ t('sync.remove') }}</div>
          <el-button :icon="DeleteForeverOutlined" @click="removeCode">
            {{ t('sync.remove') }}
          </el-button>
        </div>
      </template>

      <div v-if="newCode" class="sync-new-code settings-control-wide">
        <p class="sync-new-code__title">{{ t('sync.newCodeTitle') }}</p>
        <p class="sync-new-code__warning">{{ t('sync.newCodeWarning') }}</p>
        <code class="sync-new-code__code">{{ newCode }}</code>
        <div class="sync-new-code__actions">
          <el-button type="primary" :icon="CopyRound" @click="copyCode">
            {{ t('sync.copy') }}
          </el-button>
          <el-button @click="dismissNewCode">{{ t('newtab:common.confirm') }}</el-button>
        </div>
      </div>
    </SettingsSection>
  </div>
</template>

<style lang="scss" scoped>
.sync-code-masked {
  font-family: var(--el-font-family-mono);
  color: var(--el-text-color-primary);
}

.sync-code-input-row {
  display: flex;
  gap: 8px;
  width: 100%;
  max-width: 420px;
}

.sync-new-code {
  display: grid;
  gap: 10px;
  padding: 16px;
  margin-top: 4px;
  background: var(--el-fill-color-light);
  border-radius: 8px;

  &__title {
    margin: 0;
    font-weight: 600;
  }

  &__warning {
    margin: 0;
    font-size: 12px;
    color: var(--el-color-warning);
  }

  &__code {
    padding: 8px 10px;
    overflow-wrap: anywhere;
    background: var(--el-bg-color);
    border-radius: 6px;
  }

  &__actions {
    display: flex;
    gap: 8px;
  }
}
</style>