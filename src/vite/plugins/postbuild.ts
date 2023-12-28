import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { default as fs } from 'fs-extra'
import pc from 'picocolors'
import type { Logger, PluginOption } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))
const deadlinksPath = resolve(__dirname, '../.vocs/cache/deadlinks.json')

export function postbuild({ logger }: { logger?: Logger } = {}): PluginOption {
  return {
    name: 'postbuild',
    closeBundle() {
      if (!fs.existsSync(deadlinksPath)) return

      const deadlinks = fs.readJSONSync(deadlinksPath)
      logger?.error(
        [
          'found dead links:',
          '',
          ...deadlinks.map(
            ([link, path]: [string, string]) => `${pc.red(link)} in ${pc.blue(path)}`,
          ),
          pc.italic(pc.gray('skip by setting link to "#TODO".')),
          '\n',
        ].join('\n'),
        {
          clear: true,
          timestamp: true,
        },
      )
      throw new Error('deadlinks found.')
    },
  }
}
