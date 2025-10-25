import { resolve } from 'node:path'
import { default as fs } from 'fs-extra'
import pc from 'picocolors'
import type { Logger, PluginOption } from 'vite'

import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'

const deadlinksPath = resolve(import.meta.dirname, '../.vocs/cache/deadlinks.json')

export function postbuild({ logger }: { logger?: Logger } = {}): PluginOption {
  return {
    name: 'postbuild',
    buildStart() {
      try {
        fs.removeSync(deadlinksPath)
      } catch {}
    },
    async closeBundle() {
      if (!fs.existsSync(deadlinksPath)) return

      const { config } = await resolveVocsConfig()
      const { checkDeadlinks } = config

      // Skip if deadlinks checking is disabled
      if (checkDeadlinks === false) return

      const deadlinks = fs.readJSONSync(deadlinksPath)
      const message = [
        'found dead links:',
        '',
        ...deadlinks.map(([link, path]: [string, string]) => `${pc.red(link)} in ${pc.blue(path)}`),
        pc.italic(pc.gray('skip by setting link to "#TODO".')),
        '\n',
      ].join('\n')

      if (checkDeadlinks === 'warn') {
        logger?.warn(message, {
          clear: true,
          timestamp: true,
        })
      } else {
        logger?.error(message, {
          clear: true,
          timestamp: true,
        })
        throw new Error('deadlinks found.')
      }
    },
  }
}
