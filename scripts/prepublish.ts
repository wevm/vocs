import { join } from 'node:path'
import { default as fs } from 'fs-extra'

// Writes the current package.json version to `./src/cli/version.ts`.
const versionFilePath = join(import.meta.dirname, '../src/cli/version.ts')
const packageJsonPath = join(import.meta.dirname, '../src/package.json')
const packageVersion = fs.readJsonSync(packageJsonPath).version

fs.writeFileSync(versionFilePath, `export const version = '${packageVersion}'\n`)
