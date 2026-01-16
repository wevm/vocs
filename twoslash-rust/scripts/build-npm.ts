import * as fs from 'node:fs'
import * as path from 'node:path'

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const version = pkg.version

interface Platform {
  name: string
  os: string
  cpu: string
  libc?: string
  rustTarget: string
}

const platforms: Platform[] = [
  {
    name: 'darwin-arm64',
    os: 'darwin',
    cpu: 'arm64',
    rustTarget: 'aarch64-apple-darwin',
  },
  {
    name: 'darwin-x64',
    os: 'darwin',
    cpu: 'x64',
    rustTarget: 'x86_64-apple-darwin',
  },
  {
    name: 'linux-x64-gnu',
    os: 'linux',
    cpu: 'x64',
    libc: 'glibc',
    rustTarget: 'x86_64-unknown-linux-gnu',
  },
]

const artifactsDir = process.env.ARTIFACTS_DIR || 'artifacts'
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

  const binaryName = platform.os === 'win32' ? 'rust-twoslash.exe' : 'rust-twoslash'
  const artifactPath = path.join(artifactsDir, `bindings-${platform.rustTarget}`, binaryName)

  if (fs.existsSync(artifactPath)) {
    fs.copyFileSync(artifactPath, path.join(binDir, binaryName))
    fs.chmodSync(path.join(binDir, binaryName), 0o755)
    console.log(`✓ ${packageName}: copied binary from ${artifactPath}`)
  } else {
    console.log(`⚠ ${packageName}: no artifact at ${artifactPath}`)
  }
}

console.log('\nGenerated platform packages:')
for (const platform of platforms) {
  console.log(`  - @vocs/twoslash-rust-${platform.name}`)
}
