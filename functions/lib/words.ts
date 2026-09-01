import { SYNC_WORDS } from './wordlist'

const WORD_SET = new Set(SYNC_WORDS)

/** 无偏随机索引（拒绝采样，避免取模偏置）。 */
function randomIndex(max: number): number {
  if (max <= 0) throw new Error('Sync word list is empty')
  const limit = Math.floor(0xffffffff / max) * max
  const buffer = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buffer)
    const value = buffer[0]!
    if (value < limit) return value % max
  }
}

/** 生成由 N 个随机单词组成的同步码，如 "abacus-sunset-...-zoom"。 */
export function pickSyncCode(wordCount = 10): string {
  const picks: string[] = []
  for (let i = 0; i < wordCount; i++) {
    picks.push(SYNC_WORDS[randomIndex(SYNC_WORDS.length)]!)
  }
  return picks.join('-')
}

/** 校验同步码格式：恰好 10 个小写单词，且每个词都在词表内。 */
export function isValidSyncCode(code: string): boolean {
  const parts = code.split('-')
  if (parts.length !== 10) return false
  return parts.every((word) => WORD_SET.has(word))
}

/** SHA-256 摘要的十六进制串，作为 KV 键使用（不存储原始同步码）。 */
export async function hashSyncCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}