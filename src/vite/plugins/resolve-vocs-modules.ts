import { extname, resolve } from 'node:path'
import type { PluginOption } from 'vite'

import type { ParsedConfig } from '../../config.js'
import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'

export function resolveVocsModules(): PluginOption {
  let config: ParsedConfig
  return {
    name: 'resolve-vocs',
    async buildStart() {
      config = (await resolveVocsConfig()).config
    },
    transform(code_, id) {
      let code = code_
      if (id.startsWith(resolve(config.rootDir))) {
        if (['.js', '.jsx', '.ts', '.tsx', '.md', '.mdx'].includes(extname(id))) {
          code = code.replace(
            /import (.*) from ("|')vocs("|')/g,
            `import $1 from $2${resolve(import.meta.dirname, '../..')}$3`,
          )
          code = code.replace(
            /import (.*) from ("|')vocs\/components("|')/g,
            `import $1 from $2${resolve(import.meta.dirname, '../../components')}$3`,
          )
        }
      }
      return code
    },
  }
}
