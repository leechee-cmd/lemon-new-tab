import { useLanModeStore, type QuickLink, type QuickLinkGroup } from '@/shared/quickLinks'

export interface QuickLinkDisplayItem {
  url: string
  title: string
  favicon?: string
  isPinned: boolean
  originalIndex: number
  groupId?: string
}

export function buildQuickLinkDisplayItems(quickLinks: QuickLink[]): QuickLinkDisplayItem[] {
  const lanMode = useLanModeStore()
  const result: QuickLinkDisplayItem[] = Array.from({ length: quickLinks.length })

  for (let i = 0, len = quickLinks.length; i < len; i++) {
    const site = quickLinks[i]!
    result[i] = {
      url: lanMode.resolveLanLinkUrl(site),
      title: site.title,
      favicon: site.favicon,
      isPinned: true,
      originalIndex: i,
    }
  }

  return result
}

export function buildQuickLinkGroupItems(group: QuickLinkGroup): QuickLinkDisplayItem[] {
  const lanMode = useLanModeStore()
  const result: QuickLinkDisplayItem[] = Array.from({ length: group.items.length })

  for (let i = 0, len = group.items.length; i < len; i++) {
    const item = group.items[i]!
    result[i] = {
      url: lanMode.resolveLanLinkUrl(item),
      title: item.title,
      favicon: item.favicon,
      isPinned: true,
      originalIndex: i,
      groupId: group.id,
    }
  }

  return result
}

export function withSortableIndexes<T extends QuickLinkDisplayItem>(items: T[]) {
  const sortableStoreIndexes: number[] = []
  const nextItems: Array<T & { sortableIndex?: number }> = Array.from({ length: items.length })

  for (let i = 0, len = items.length; i < len; i++) {
    const item = items[i]!
    if (!item.isPinned) {
      nextItems[i] = item
      continue
    }

    const sortableIndex = sortableStoreIndexes.length
    sortableStoreIndexes.push(item.originalIndex)
    nextItems[i] = { ...item, sortableIndex }
  }

  return {
    items: nextItems,
    sortableStoreIndexes,
  }
}
