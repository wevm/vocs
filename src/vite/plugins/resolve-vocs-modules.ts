import { basename, dirname, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type PluginOption } from 'vite'

import type { ParsedConfig } from '../../config.js'
import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'
import { slash } from '../utils/slash.js'
import { isWin32 } from '../utils/paths.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Get the result of `/node_modules/vocs/_lib`
const libDir = slash(resolve(__dirname, '../..').replace(process.cwd(), ''))

function getRelativeLibDir(path: string) {
  // Default level: when the file is located in `docs/pages`
  let level = 2

  const name = basename(path)
  const middle = path.replace('/pages/', '').replace(name, '')
  const middles = middle.split('/').filter((i) => !!i)
  if (middles.length > 0) level += middles.length

  // e.g. `../../node_modules/vocs/_lib`
  const levels = new Array(level).fill('..').join('/')
  return `${levels}${libDir}`
}

export function resolveVocsModules(): PluginOption {
  let config: ParsedConfig
  return {
    name: 'resolve-vocs',
    async buildStart() {
      config = (await resolveVocsConfig()).config
    },
    transform(code_, id) {
      const resolvedRootDir = resolve(config.rootDir)
      const resolvedId = resolve(id)

      let code = code_
      if (resolvedId.startsWith(resolvedRootDir)) {
        if (['.js', '.jsx', '.ts', '.tsx', '.md', '.mdx'].includes(extname(id))) {
          // The relative path with file name
          const relative = slash(resolvedId.replace(resolvedRootDir, ''))

          code = code.replace(
            /import (.*) from ("|')vocs("|')/g,
            `import $1 from $2${
              isWin32 ? getRelativeLibDir(relative) : resolve(__dirname, '../..')
            }$3`,
          )

          code = code.replace(
            /import (.*) from ("|')vocs\/components("|')/g,
            `import $1 from $2${
              isWin32
                ? `${getRelativeLibDir(relative)}/components`
                : resolve(__dirname, '../../components')
            }$3`,
          )
        }
      }
      return code
    },
  }
}
