import * as node_fs from 'node:fs'
import MagicString from 'magic-string'

/**
 * Accumulates character-range patches per file and flushes them all at once.
 *
 * Used by the twoslash inline cache to write `// @twoslash-cache: ...` comments
 * back into the original markdown source after a code block has been processed.
 *
 * Ported from `@shikijs/vitepress-twoslash`'s `FilePatcher`.
 */
export class FilePatcher {
  private files = new Map<string, { content: string; patches: Map<string, string> } | null>()

  /** Build a patch key from a character range. Omitting `to` denotes an insertion. */
  static key(from: number, to?: number): string {
    return `${from}${to ? `:${to}` : ''}`
  }

  /**
   * Load a file's contents (cached for the lifetime of the patcher, until
   * flushed via {@link patch}). Returns `null` if the file does not exist.
   */
  load(path: string): { content: string; patches: Map<string, string> } | null {
    let file = this.files.get(path)
    if (file === undefined) {
      if (node_fs.existsSync(path)) {
        const content = node_fs.readFileSync(path, { encoding: 'utf-8' })
        file = { content, patches: new Map() }
      } else {
        file = null
      }
      this.files.set(path, file)
    }
    return file
  }

  /** Apply all queued patches for `path` and write the result back to disk. */
  patch(path: string): void {
    const file = this.files.get(path)
    if (!file) return

    if (file.patches.size) {
      const s = new MagicString(file.content)

      for (const [key, value] of file.patches) {
        const [from, to] = key.split(':').map((x) => (x !== '' ? Number(x) : undefined))
        if (from === undefined) continue

        if (to !== undefined) s.update(from, to, value)
        else s.appendRight(from, value)
      }

      const content = s.toString()
      if (content !== file.content) node_fs.writeFileSync(path, content, { encoding: 'utf-8' })
    }

    this.files.delete(path)
  }
}
