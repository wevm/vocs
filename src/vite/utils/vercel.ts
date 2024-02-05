import { resolve } from 'node:path'
import { default as fs } from 'fs-extra'

export const vercelBuildOutputDir = resolve(process.cwd(), '.vercel/output')

export function writeBuildOutputConfig() {
  fs.writeJsonSync(resolve(vercelBuildOutputDir, 'config.json'), { version: 3 })
}
