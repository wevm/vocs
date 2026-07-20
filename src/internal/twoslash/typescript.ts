import { createRequire } from 'node:module'
import * as path from 'node:path'
import type { TS } from 'twoslash/core'

export function fromProject(options: fromProject.Options = {}): TS {
  const { rootDir = process.cwd() } = options

  try {
    const require = createRequire(path.join(rootDir, 'package.json'))
    return require('typescript') as TS
  } catch {
    throw new Error(
      'Using twoslash code blocks requires `typescript` to be installed in your project.',
    )
  }
}

export declare namespace fromProject {
  type Options = {
    rootDir?: string | undefined
  }
}
