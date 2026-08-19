<script lang="ts" setup>
import { computed } from 'vue'
import { useTranslation } from 'i18next-vue'
import CheckRound from '~icons/ic/round-check'
import HomeRound from '~icons/ic/round-home'
import PublicRound from '~icons/ic/round-public'

import { useLanModeStore, type LanMode } from '@/shared/quickLinks'
import { useSettingsStore } from '@/shared/settings'

import usePerfClasses from '@newtab/composables/usePerfClasses'

const { t } = useTranslation()
const settings = useSettingsStore()
const lanMode = useLanModeStore()

const perf = usePerfClasses(() => ({
  transparent: settings.perf.actionBtns.transparent,
  transparency: settings.perf.actionBtns.transparency,
  blur: settings.perf.actionBtns.blur,
}))
const popperPerfClass = perf('lan-mode-btn__popper')

const dropdownPlacement = computed(() => {
  const pos = settings.layout.actionBtnPosition
  const vertical = pos.startsWith('top') ? 'bottom' : 'top'
  const horizontal = pos.endsWith('left') ? 'start' : 'end'
  return `${vertical}-${horizontal}` as const
})

// 图标随状态变化：强制本地，或自动且在「在家」时显示 home，其余显示 public
const displayIcon = computed(() =>
  lanMode.mode === 'forceLocal' || (lanMode.mode === 'auto' && lanMode.probeStatus === 'home')
    ? HomeRound
    : PublicRound,
)

// 自动模式菜单项展示当前探测状态；未设置探针时不追加括号，仅显示「自动」
const autoStatusLabel = computed(() => {
  if (!settings.probeUrl?.trim()) return ''
  if (lanMode.probeStatus === 'home') return t('lanMode.auto.home')
  if (lanMode.probeStatus === 'away') return t('lanMode.auto.away')
  return t('lanMode.auto.probing')
})

function selectMode(next: LanMode) {
  lanMode.setMode(next)
}

function clickCurrentTarget(event: KeyboardEvent) {
  ;(event.currentTarget as HTMLElement | null)?.click()
}
</script>

<template>
  <el-dropdown
    style="display: block"
    :popper-class="popperPerfClass"
    :show-arrow="false"
    :placement="dropdownPlacement"
    trigger="click"
    @contextmenu.prevent.stop
  >
    <div
      role="button"
      tabindex="0"
      class="action-btn lan-mode-btn"
      :aria-label="t('a11y.openLanModeMenu')"
      aria-haspopup="menu"
      @keydown.enter.prevent="clickCurrentTarget"
      @keydown.space.prevent="clickCurrentTarget"
    >
      <el-icon><component :is="displayIcon" /></el-icon>
    </div>
    <template #dropdown>
      <el-dropdown-menu class="noselect">
        <el-dropdown-item @click="selectMode('auto')">
          <el-icon :class="{ 'lan-mode__check--hidden': lanMode.mode !== 'auto' }">
            <check-round />
          </el-icon>
          <span>{{ t('lanMode.auto.label') }}<template v-if="autoStatusLabel">（{{ autoStatusLabel }}）</template></span>
        </el-dropdown-item>
        <el-dropdown-item @click="selectMode('forceLocal')">
          <el-icon :class="{ 'lan-mode__check--hidden': lanMode.mode !== 'forceLocal' }">
            <check-round />
          </el-icon>
          <span>{{ t('lanMode.forceLocal') }}</span>
        </el-dropdown-item>
        <el-dropdown-item @click="selectMode('forceRemote')">
          <el-icon :class="{ 'lan-mode__check--hidden': lanMode.mode !== 'forceRemote' }">
            <check-round />
          </el-icon>
          <span>{{ t('lanMode.forceRemote') }}</span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>
