/**
 * Repository file access for builds in Node. Lists files under a root, skipping dependency,
 * output, and hidden directories, with `/`-separated paths relative to the root.
 * @module
 */
import * as Fs from 'node:fs/promises'
import * as Path from 'node:path'
import type * as Source from '../Source.js'

const skipped = new Set(['dist', 'node_modules'])

export function create(root: string): Source.Files {
  return {
    async list() {
      const paths: string[] = []
      for await (const entry of Fs.glob('**/*', {
        cwd: root,
        exclude: (entry) => skipped.has(entry.name) || entry.name.startsWith('.'),
        withFileTypes: true,
      })) {
        if (!entry.isFile()) continue
        paths.push(
          Path.relative(root, Path.join(entry.parentPath, entry.name)).split(Path.sep).join('/'),
        )
      }
      return paths.sort()
    },
    read(path) {
      return Fs.readFile(Path.join(root, path), 'utf8')
    },
  }
}
