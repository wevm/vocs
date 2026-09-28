import { execFileSync } from 'node:child_process'
import { realpathSync } from 'node:fs'
import * as path from 'node:path'

type Dates = { root: string; head: string; values: Map<string, string> }

const datesByDirectory = new Map<string, Dates>()

export function resetCache() {
  datesByDirectory.clear()
}

export function getLastModified(filePath: string, pagesDir: string): string | undefined {
  try {
    const directory = realpathSync(pagesDir)
    let dates = datesByDirectory.get(directory)
    const head =
      dates && process.env['NODE_ENV'] === 'production'
        ? dates.head
        : git(['rev-parse', 'HEAD'], directory)

    if (!dates || dates.head !== head) {
      const root = git(['rev-parse', '--show-toplevel'], directory)
      const log = git(['log', '-z', '--format=%cI%x00', '--name-only', '--', directory], directory)
      const values = new Map<string, string>()
      let date: string | undefined
      for (const entry of log.split('\0')) {
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/.test(entry)) {
          date = entry
        } else {
          const file = entry.startsWith('\n') ? entry.slice(1) : entry
          if (file && date && !values.has(file)) values.set(file, date)
        }
      }
      dates = { root, head, values }
      datesByDirectory.set(directory, dates)
    }

    const relativeFile = path.relative(path.resolve(pagesDir), path.resolve(filePath))
    const file = path
      .relative(dates.root, path.join(directory, relativeFile))
      .split(path.sep)
      .join('/')
    return dates.values.get(file)
  } catch {
    return undefined
  }
}

function git(args: string[], cwd: string): string {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf-8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
}
