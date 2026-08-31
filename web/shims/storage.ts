/**
 * Web 版 @wxt-dev/storage 的 localStorage 适配层。
 *
 * 只实现应用实际用到的子集：
 * - `defineItem`（含 fallback / version / migrations / watch）——设置、快捷链接等持久化
 * - `getItem` / `setItem` / `removeItem` / `removeItems` / `clear` / `snapshot` / `unwatch`
 *
 * 语义与 @wxt-dev/storage 保持一致：
 * - 逻辑 key 为 `area:key`，物理存储到 `leetab:<area>:<key>`（localStorage / sessionStorage）
 * - 元数据存于物理 key + "$"（用于 version 与迁移）
 * - 同标签页写入即时 emit，跨标签页通过 `storage` 事件分发给 watchers
 */

const STORAGE_PREFIX = 'leetab:'

type Area = 'local' | 'session' | 'sync' | 'managed'

export function physicalKey(area: Area, key: string): string {
  return `${STORAGE_PREFIX}${area}:${key}`
}

function backingStorage(area: Area): Storage {
  // session 区域天然放 sessionStorage，其余放 localStorage（同步区域降级为 localStorage）
  if (area === 'session' && typeof sessionStorage !== 'undefined') return sessionStorage
  return localStorage
}

class StorageShim {
  private watchers = new Map<string, Set<(newValue: unknown, oldValue: unknown) => void>>()
  private crossWindowUnlisten: (() => void) | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => this.handleStorageEvent(event))
    }
    if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(`${STORAGE_PREFIX}watchers`)
      channel.onmessage = (event) => {
        const { key, value } = (event.data ?? {}) as { key?: string; value?: unknown }
        if (key != null) this.emit(key, value, undefined)
      }
      this.crossWindowUnlisten = () => channel.close()
    }
  }

  /** 将 localStorage 的 storage 事件映射为 logicalKey 变更并分发。 */
  private handleStorageEvent(event: StorageEvent): void {
    if (event.key == null) return
    if (!event.key.startsWith(STORAGE_PREFIX)) return
    const logicalKey = this.toLogicalKey(event.key)
    if (!logicalKey) return
    let value: unknown = null
    if (event.newValue != null) {
      try {
        value = JSON.parse(event.newValue)
      } catch {
        value = event.newValue
      }
    }
    // 跨标签页写入：newValue 已是写入后的值
    this.emit(logicalKey, value, event.oldValue == null ? undefined : this.safeParse(event.oldValue))
  }

  private safeParse(raw: string | null): unknown {
    if (raw == null) return null
    try {
      return JSON.parse(raw)
    } catch {
      return raw
    }
  }

  private toLogicalKey(physical: string): string | null {
    const body = physical.slice(STORAGE_PREFIX.length)
    const sep = body.indexOf(':')
    if (sep < 0) return null
    const area = body.slice(0, sep) as Area
    const key = body.slice(sep + 1)
    return `${area}:${key}`
  }

  private rawSet(area: Area, key: string, value: unknown): void {
    const physical = physicalKey(area, key)
    const backing = backingStorage(area)
    if (value == null) {
      backing.removeItem(physical)
    } else {
      backing.setItem(physical, JSON.stringify(value))
    }
    this.emit(`${area}:${key}`, value, undefined)
    this.broadcast(`${area}:${key}`, value)
  }

  private rawGet(area: Area, key: string): unknown {
    const physical = physicalKey(area, key)
    const raw = backingStorage(area).getItem(physical)
    if (raw == null) return null
    return this.safeParse(raw)
  }

  private rawRemove(area: Area, key: string): void {
    const physical = physicalKey(area, key)
    backingStorage(area).removeItem(physical)
    this.emit(`${area}:${key}`, null, undefined)
    this.broadcast(`${area}:${key}`, null)
  }

  private broadcast(key: string, value: unknown): void {
    if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return
    const area = key.slice(0, key.indexOf(':'))
    if (area === 'session') return
    try {
      const channel = new BroadcastChannel(`${STORAGE_PREFIX}watchers`)
      channel.postMessage({ key, value })
      channel.close()
    } catch {
      // 忽略广播失败
    }
  }

  private emit(key: string, value: unknown, _old: unknown): void {
    const callbacks = this.watchers.get(key)
    if (!callbacks) return
    for (const cb of callbacks) {
      try {
        (cb as (newValue: unknown, oldValue: unknown) => void)(value, _old)
      } catch (error) {
        console.error('[storage] watcher callback failed:', error)
      }
    }
  }

  watch(key: string, cb: (newValue: unknown, oldValue: unknown) => void): () => void {
    let callbacks = this.watchers.get(key)
    if (!callbacks) {
      callbacks = new Set()
      this.watchers.set(key, callbacks)
    }
    callbacks.add(cb)
    return () => callbacks?.delete(cb)
  }

  unwatch(): void {
    this.watchers.clear()
    this.crossWindowUnlisten?.()
    this.crossWindowUnlisten = null
  }

  async getItem<T = unknown>(key: string, opts?: { fallback?: T }): Promise<T> {
    const { area, rawKey } = this.splitKey(key)
    const value = this.rawGet(area, rawKey)
    return (value ?? opts?.fallback ?? null) as T
  }

  async setItem(key: string, value: unknown): Promise<void> {
    const { area, rawKey } = this.splitKey(key)
    this.rawSet(area, rawKey, value)
  }

  async removeItem(key: string, opts?: { removeMeta?: boolean }): Promise<void> {
    const { area, rawKey } = this.splitKey(key)
    this.rawRemove(area, rawKey)
    if (opts?.removeMeta) this.rawRemove(area, `${rawKey}$`)
  }

  async removeItems(keys: Array<string | { key: string }>): Promise<void> {
    for (const entry of keys) {
      const key = typeof entry === 'string' ? entry : entry.key
      await this.removeItem(key)
    }
  }

  async clear(base: string): Promise<void> {
    const backing = backingStorage(base as Area)
    const prefix = physicalKey(base as Area, '')
    const keysToRemove: string[] = []
    for (let i = 0; i < backing.length; i++) {
      const physical = backing.key(i)
      if (physical != null && physical.startsWith(prefix)) keysToRemove.push(physical)
    }
    for (const physical of keysToRemove) backing.removeItem(physical)
    if (base === 'local') this.emitAllWithPrefix()
  }

  private emitAllWithPrefix(): void {
    // 清空后逐 key emit，通知所有 watchers 值为 null
    for (const logical of this.watchers.keys()) {
      if (logical.startsWith(`local:`)) this.emit(logical, null, undefined)
    }
  }

  async snapshot(base: string): Promise<Record<string, unknown>> {
    const backing = backingStorage(base as Area)
    const prefix = physicalKey(base as Area, '')
    const result: Record<string, unknown> = {}
    for (let i = 0; i < backing.length; i++) {
      const physical = backing.key(i)
      if (physical == null || !physical.startsWith(prefix)) continue
      const rawKey = physical.slice(prefix.length)
      if (rawKey.endsWith('$')) continue
      result[rawKey] = this.safeParse(backing.getItem(physical))
    }
    return result
  }

  async restoreSnapshot(base: string, data: Record<string, unknown>): Promise<void> {
    const { area } = this.splitKey(`${base}:__restore__`)
    for (const [key, value] of Object.entries(data)) this.rawSet(area, key, value)
  }

  defineItem<T = unknown>(key: string, options?: { fallback?: T; [k: string]: unknown }): {
    key: string
    fallback: T
    getValue: () => Promise<T>
    setValue: (value: T) => Promise<void>
    removeValue: () => Promise<void>
    watch: (cb: (newValue: T, oldValue: T) => void) => () => void
    getMeta: () => Promise<Record<string, unknown>>
    setMeta: (properties: Record<string, unknown>) => Promise<void>
    removeMeta: (properties?: string[]) => Promise<void>
    migrate: () => Promise<void>
  } {
    const { area, rawKey } = this.splitKey(key)
    const targetVersion = (options?.version as number) ?? 1
    const migrations = (options?.migrations as Record<number, (old: unknown) => unknown>) ?? {}
    const debug = (options?.debug as boolean) ?? false
    const onMigrationComplete = options?.onMigrationComplete as ((v: unknown, vn: number) => void) | undefined
    const fallback = options?.fallback as T
    const metaKey = `${rawKey}$`

    const getMetaRaw = () => {
      const raw = this.rawGet(area, metaKey)
      return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
    }

    const migrate = async (): Promise<void> => {
      const value = this.rawGet(area, rawKey)
      if (value == null) return
      const meta = getMetaRaw()
      const currentVersion = ((meta?.v as number) ?? 1) as number
      if (currentVersion > targetVersion)
        throw new Error(`Version downgrade detected (v${currentVersion} -> v${targetVersion}) for "${key}"`)
      if (currentVersion === targetVersion) return
      const toRun = Array.from({ length: targetVersion - currentVersion }, (_, i) => currentVersion + i + 1)
      let migratedValue: unknown = value
      for (const migrateVersion of toRun) {
        try {
          migratedValue = (await migrations[migrateVersion]?.(migratedValue)) ?? migratedValue
          if (debug) console.debug(`[storage] Migration processed for ${key}: v${migrateVersion}`)
        } catch (error) {
          console.error(`[storage] Migration failed for ${key}: v${migrateVersion}`, error)
          throw error
        }
      }
      this.rawSetStorageRaw(area, rawKey, migratedValue)
      this.rawSetStorageRaw(area, metaKey, { ...meta, v: targetVersion })
      onMigrationComplete?.(migratedValue, targetVersion)
    }

    const migrationsDone = migrations == null ? Promise.resolve() : migrate().catch((err) => {
      console.error(`[storage] Migration failed for ${key}`, err)
    })

    const getValue = async (): Promise<T> => {
      await migrationsDone
      const value = this.rawGet(area, rawKey)
      return (value ?? fallback) as T
    }

    const setValue = async (value: T): Promise<void> => {
      await migrationsDone
      const meta = getMetaRaw()
      if (value != null && meta?.v == null && targetVersion > 1) {
        this.rawSetStorageRaw(area, metaKey, { v: targetVersion })
      }
      this.rawSet(area, rawKey, value)
    }

    return {
      key,
      get fallback() {
        return fallback
      },
      getValue,
      setValue,
      removeValue: async () => {
        await migrationsDone
        this.rawRemove(area, rawKey)
      },
      watch: (cb) =>
        this.watch(key, (newValue, oldValue) => {
          cb((newValue ?? fallback) as T, (oldValue ?? fallback) as T)
        }),
      getMeta: async () => {
        await migrationsDone
        return getMetaRaw()
      },
      setMeta: async (properties) => {
        await migrationsDone
        const merged = { ...getMetaRaw(), ...properties }
        this.rawSetStorageRaw(area, metaKey, merged)
      },
      removeMeta: async (properties) => {
        await migrationsDone
        if (properties == null) {
          this.rawRemove(area, metaKey)
          return
        }
        const next = { ...getMetaRaw() }
        for (const prop of properties) delete next[prop]
        this.rawSetStorageRaw(area, metaKey, next)
      },
      migrate,
    }
  }

  /** 直接写物理存储，不触发逻辑 key 的 watch（用于迁移/元数据内部写）。 */
  private rawSetStorageRaw(area: Area, rawKey: string, value: unknown): void {
    const physical = physicalKey(area, rawKey)
    backingStorage(area).setItem(physical, JSON.stringify(value))
  }

  private splitKey(key: string): { area: Area; rawKey: string } {
    const sep = key.indexOf(':')
    if (sep < 0) throw new Error(`Storage key should be in the form of "area:key", but received "${key}"`)
    const area = key.slice(0, sep) as Area
    const rawKey = key.slice(sep + 1)
    return { area, rawKey }
  }
}

export const storage = new StorageShim()

export type StorageArea = 'local' | 'session' | 'sync' | 'managed'
export type StorageItemKey = string
export type Unwatch = () => void
export type WatchCallback<T = unknown> = (newValue: T, oldValue: T) => void
export type GetItemOptions<T = unknown> = { fallback?: T }
export type RemoveItemOptions = { removeMeta?: boolean }
export type SnapshotOptions = Record<string, never>
export type StorageAreaChanges = Record<string, { newValue?: unknown; oldValue?: unknown }>
export type WxtStorage = typeof storage
export type MigrationError = Error
export type WxtStorageItem<T = unknown> = ReturnType<typeof storage.defineItem<T>>
export type WxtStorageItemOptions<T = unknown> = {
  fallback?: T
  version?: number
  migrations?: Record<number, (old: unknown) => unknown>
  [k: string]: unknown
}
