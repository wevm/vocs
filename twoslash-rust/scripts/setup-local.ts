/**
 * Sets up temporary stub packages for local development.
 * This allows `pnpm install` to succeed when the platform-specific
 * binary packages haven't been built/published yet.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const version = pkg.version

interface Platform {
  name: string
  os: string
  cpu: string
  libc?: string
}

const platforms: Platform[] = [
  { name: 'darwin-arm64', os: 'darwin', cpu: 'arm64' },
  { name: 'darwin-x64', os: 'darwin', cpu: 'x64' },
  { name: 'linux-x64-gnu', os: 'linux', cpu: 'x64', libc: 'glibc' },
]

const npmDir = 'npm'
fs.mkdirSync(npmDir, { recursive: true })

for (const platform of platforms) {
  const packageName = `@vocs/twoslash-rust-${platform.name}`
  const packageDir = path.join(npmDir, platform.name)
  const binDir = path.join(packageDir, 'bin')

  fs.mkdirSync(binDir, { recursive: true })

  const platformPkg: Record<string, unknown> = {
    name: packageName,
    version,
    os: [platform.os],
    cpu: [platform.cpu],
    main: './bin/rust-twoslash',
    files: ['bin'],
    license: 'MIT',
  }

  if (platform.libc) {
    platformPkg.libc = [platform.libc]
  }

  fs.writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify(platformPkg, null, 2))

  // Create a stub binary that prints a helpful message
  const stubScript = `#!/usr/bin/env node
console.error('twoslash-rust binary not built. Run: cd twoslash-rust && cargo build --release')
process.exit(1)
`
  fs.writeFileSync(path.join(binDir, 'rust-twoslash'), stubScript)
  fs.chmodSync(path.join(binDir, 'rust-twoslash'), 0o755)

  console.log(`✓ ${packageName}`)
}

console.log('\nStub packages created. Now run: pnpm install')
