import { createHash } from 'node:crypto'

export function hash(text: Buffer | string, length?: number): string {
  let hash = createHash('sha256').update(text).digest('hex')
  if (length) hash = hash.substring(0, length)
  return hash
}
