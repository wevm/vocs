import { join } from 'node:path'

// Writes the current package.json version to `./src/cli/version.ts`.
const versionFilePath = join(import.meta.dir, '../src/cli/version.ts')
const packageJsonPath = join(import.meta.dir, '../src/package.json')
const packageVersion = (await Bun.file(packageJsonPath).json()).version

Bun.write(versionFilePath, `export const version = '${packageVersion}'\n`)
