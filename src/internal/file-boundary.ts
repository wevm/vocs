import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type { Config } from './config.js'

export function isWithin(root: string, file: string): boolean {
  const relative = path.relative(root, file)
  return (
    relative === '' ||
    (relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative))
  )
}

export async function assertSafeContentSymlinks(config: Config): Promise<void> {
  for (const dir of [
    path.resolve(config.rootDir, config.srcDir, config.pagesDir),
    path.resolve(config.rootDir, 'public'),
  ]) {
    await assertSafeDirectory(dir, config.rootDir)
  }
}

async function assertSafeDirectory(dir: string, projectRoot: string): Promise<void> {
  const relative = path.relative(projectRoot, dir)
  let current = projectRoot
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment)
    const stats = await fs.lstat(current).catch((error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') return undefined
      throw error
    })
    if (!stats) return
    if (stats.isSymbolicLink()) throw new Error(`[vocs] Content directory is a symlink: ${current}`)
  }

  const realRoot = await fs.realpath(dir)
  const seen = new Set<string>()

  async function visit(directory: string): Promise<void> {
    const realDirectory = await fs.realpath(directory)
    if (seen.has(realDirectory)) return
    seen.add(realDirectory)

    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name)
      if (entry.isSymbolicLink()) {
        const target = await fs.realpath(file)
        if (!isWithin(realRoot, target))
          throw new Error(`[vocs] Content symlink escapes ${dir}: ${file}`)
        if ((await fs.stat(file)).isDirectory()) await visit(file)
      } else if (entry.isDirectory()) {
        await visit(file)
      }
    }
  }

  await visit(dir)
}
