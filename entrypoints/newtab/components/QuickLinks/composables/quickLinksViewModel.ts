import type { QuickLinkGroup } from '@/shared/quickLinks'

import {
  buildQuickLinkGroupItems,
  type QuickLinkDisplayItem,
  withSortableIndexes,
} from './quickLinkDisplayItems'

export type QuickLinkViewItem = QuickLinkDisplayItem & { sortableIndex?: number }

export type QuickLinkPage = {
  key: string
  groupId: string
  pageInGroup: number
  totalPagesInGroup: number
  items: QuickLinkViewItem[]
  sortableStoreIndexes: number[]
}

export type QuickLinkScrollSection = {
  key: string
  title?: string
  groupId?: string
  items: QuickLinkViewItem[]
  sortableStoreIndexes: number[]
}

export function splitQuickLinkPages(
  groupId: string,
  items: QuickLinkDisplayItem[],
  slotsPerPage: number,
): QuickLinkPage[] {
  const slots = Math.max(1, slotsPerPage)
  const totalPagesInGroup = Math.max(1, Math.ceil((items.length + 1) / slots))

  return Array.from({ length: totalPagesInGroup }, (_, pageInGroup) => {
    const isLastPage = pageInGroup === totalPagesInGroup - 1
    const start = pageInGroup * slots
    const maxItems = isLastPage ? slots - 1 : slots
    const pageItems = withSortableIndexes(items.slice(start, start + maxItems))
    return {
      key: `${groupId}-${pageInGroup}`,
      groupId,
      pageInGroup,
      totalPagesInGroup,
      items: pageItems.items,
      sortableStoreIndexes: pageItems.sortableStoreIndexes,
    }
  })
}

export function buildQuickLinkPages(options: {
  grouping: boolean
  groups: readonly QuickLinkGroup[]
  legacyItems: QuickLinkDisplayItem[]
  slotsPerPage: number
  defaultGroupId: string
  flatGroupId: string
}): QuickLinkPage[] {
  if (!options.grouping) {
    return splitQuickLinkPages(
      options.flatGroupId,
      options.legacyItems,
      options.slotsPerPage,
    )
  }

  const hasQuickLinkItems = options.groups.some((group) => group.items.length > 0)
  if (!hasQuickLinkItems) {
    return splitQuickLinkPages(options.defaultGroupId, [], options.slotsPerPage)
  }

  const result = options.groups.flatMap((group) =>
    splitQuickLinkPages(group.id, buildQuickLinkGroupItems(group), options.slotsPerPage),
  )
  return result.length > 0
    ? result
    : splitQuickLinkPages(options.defaultGroupId, [], options.slotsPerPage)
}

export function buildQuickLinkScrollSections(options: {
  grouping: boolean
  groups: readonly QuickLinkGroup[]
  legacyItems: QuickLinkDisplayItem[]
  defaultGroupId: string
  defaultGroupName?: string
}): QuickLinkScrollSection[] {
  if (!options.grouping) {
    const legacyItems = withSortableIndexes(options.legacyItems)
    return [
      {
        key: 'quick-links',
        items: legacyItems.items,
        sortableStoreIndexes: legacyItems.sortableStoreIndexes,
      },
    ]
  }

  const sections: QuickLinkScrollSection[] = options.groups.map((group) => {
    const items = withSortableIndexes(buildQuickLinkGroupItems(group))
    return {
      key: group.id,
      title: group.name,
      groupId: group.id,
      items: items.items,
      sortableStoreIndexes: items.sortableStoreIndexes,
    }
  })

  return sections.length > 0
    ? sections
    : [
        {
          key: options.defaultGroupId,
          title: options.defaultGroupName,
          groupId: options.defaultGroupId,
          items: [],
          sortableStoreIndexes: [],
        },
      ]
}
