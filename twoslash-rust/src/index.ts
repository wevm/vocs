import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function getBinaryPath(): string {
  const binaryName = process.platform === 'win32' ? 'rust-twoslash.exe' : 'rust-twoslash'

  // Check for local dev build first (monorepo development)
  const devBinaryPath = path.resolve(__dirname, '../target/release', binaryName)
  if (fs.existsSync(devBinaryPath)) {
    return devBinaryPath
  }

  const platformPackage = getPlatformPackage()

  try {
    const packagePath = path.dirname(require.resolve(`${platformPackage}/package.json`))
    const binaryPath = path.join(packagePath, 'bin', binaryName)
    if (fs.existsSync(binaryPath)) {
      return binaryPath
    }
  } catch {}

  const fallback = findInPath(binaryName)
  if (fallback) return fallback

  throw new Error(
    `@vocs/twoslash-rust: Could not find binary for platform ${process.platform}-${process.arch}.\n` +
      `Try installing the platform-specific package: npm install ${platformPackage}\n` +
      `Or install via cargo: cargo install rust-twoslash --git https://github.com/wevm/twoslash-rust --locked`,
  )
}

function getPlatformPackage(): string {
  const platform = process.platform
  const arch = process.arch

  if (platform === 'darwin' && arch === 'arm64') {
    return '@vocs/twoslash-rust-darwin-arm64'
  }
  if (platform === 'darwin' && arch === 'x64') {
    return '@vocs/twoslash-rust-darwin-x64'
  }
  if (platform === 'linux' && arch === 'x64') {
    const { familySync, MUSL } = require('detect-libc') as typeof import('detect-libc')
    if (familySync() === MUSL) {
      throw new Error('@vocs/twoslash-rust: musl libc is not currently supported')
    }
    return '@vocs/twoslash-rust-linux-x64-gnu'
  }

  throw new Error(
    `@vocs/twoslash-rust: Unsupported platform ${platform}-${arch}.\n` +
      `Install via cargo instead: cargo install rust-twoslash --git https://github.com/wevm/twoslash-rust --locked`,
  )
}

function findInPath(binaryName: string): string | null {
  try {
    const command = process.platform === 'win32' ? 'where' : 'which'
    const result = execSync(`${command} ${binaryName}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    })
    const binaryPath = result.trim().split('\n')[0]
    if (binaryPath && fs.existsSync(binaryPath)) {
      return binaryPath
    }
  } catch {}
  return null
}
