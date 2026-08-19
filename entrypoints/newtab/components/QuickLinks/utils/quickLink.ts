import i18next from 'i18next'

import {
  DEFAULT_QUICK_LINK_GROUP_ID,
  useQuickLinksStore,
  type QuickLink,
  type QuickLinkTarget,
} from '@/shared/quickLinks'
import { useSettingsStore } from '@/shared/settings'

import { isValidUrl } from '@newtab/shared/utils'

export function openQuickLinkUrl(url: string, target: '_blank' | '_self') {
  if (!isValidUrl(url)) return
  window.open(url, target, target === '_blank' ? 'noopener,noreferrer' : undefined)
}

export async function removeQuickLink(
  target: QuickLinkTarget,
  store: ReturnType<typeof useQuickLinksStore>,
  refresh: () => Promise<void>,
) {
  const quickLink = store.getQuickLink(target)
  if (!quickLink) return
  const { url, title, favicon, localUrl } = quickLink

  if (typeof target === 'number') {
    await store.removeFlatQuickLink(target)
  } else {
    await store.removeQuickLinkFromGroup(target.groupId, target.index)
  }
  await refresh()
  ElMessage.success({
    message: h('p', null, [
      h(
        'span',
        { style: { color: 'var(--el-color-success)' } },
        i18next.t('newtab:quickLinks.unpinMessage'),
      ),
      h(
        'span',
        {
          style: { marginLeft: '20px', color: 'var(--el-color-primary)', cursor: 'pointer' },
          onClick: async () => {
            const restored: QuickLink = { url, title, favicon }
            // 恢复时必须带上 localUrl，否则内网链接撤销后内网属性丢失
            if (localUrl) restored.localUrl = localUrl
            if (typeof target === 'number') {
              await store.insertFlatQuickLink({
                quickLink: restored,
                index: target,
              })
            } else {
              await store.insertQuickLinkToGroup({
                groupId: target.groupId,
                quickLink: restored,
                index: target.index,
              })
            }
            await refresh()
          },
        },
        i18next.t('newtab:common.undo'),
      ),
    ]),
  })
}

export async function pinQuickLink(
  store: ReturnType<typeof useQuickLinksStore>,
  refresh: () => Promise<void>,
  url: string,
  title: string,
  favicon?: string,
) {
  if (useSettingsStore().quickLinks.grouping) {
    await store.addQuickLinkToGroup(DEFAULT_QUICK_LINK_GROUP_ID, { url, title, favicon })
  } else {
    await store.addFlatQuickLink({ url, title, favicon })
  }
  await refresh()
}
