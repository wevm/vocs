// TODO: spice it up

import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
// @ts-expect-error
import { detect } from 'detect-package-manager'
import { execa } from 'execa'
import { default as fs } from 'fs-extra'
import { default as prompts } from 'prompts'

type InitParameters = { name: string; git: boolean; install: boolean }

const __dirname = dirname(fileURLToPath(import.meta.url))

export async function init(options: InitParameters) {
  const templateDir = resolve(__dirname, '../templates/default')

  const displayName =
    options.name ||
    ((
      await prompts({
        type: 'text',
        name: 'displayName',
        message: 'Enter the name of your project',
        validate: (value) => (value ? true : 'Please enter a name'),
      })
    ).displayName as string)
  const name = kebabcase(displayName) as string

  const destDir = resolve(process.cwd(), name)

  console.log(`Scaffolding project in ${name}...`)

  // Copy contents
  fs.copySync(templateDir, destDir)

  // Replace dotfiles
  for (const file of fs.readdirSync(destDir)) {
    if (!file.startsWith('_')) continue
    fs.renameSync(resolve(destDir, file), resolve(destDir, `.${file.slice(1)}`))
  }

  // Replace package.json properties
  const pkgJson = fs.readJsonSync(resolve(destDir, 'package.json'))
  pkgJson.name = name
  fs.writeJsonSync(resolve(destDir, 'package.json'), pkgJson, { spaces: 2 })

  //  Install dependencies
  if (options.install) {
    const packageManager =
      typeof options.install === 'string' ? options.install : detectPackageManager()
    await execa(packageManager, ['install', packageManager === 'npm' ? '--quiet' : '--silent'], {
      cwd: destDir,
      env: {
        ...process.env,
        ADBLOCK: '1',
        DISABLE_OPENCOLLECTIVE: '1',
        // we set NODE_ENV to development as pnpm skips dev
        // dependencies when production
        NODE_ENV: 'development',
      },
    })
  }

  // Create git repository
  if (options.git) {
    await execa('git', ['init'], { cwd: destDir })
    await execa('git', ['add', '.'], { cwd: destDir })
    await execa('git', ['commit', '--no-verify', '--message', 'initial commit'], {
      cwd: destDir,
    })
  }

  console.log('Done!')
}

export function kebabcase(str: string) {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.join('-')
    .toLowerCase()
}

export function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent
  if (!userAgent) return 'npm'
  if (userAgent.includes('pnpm')) return 'pnpm'
  if (userAgent.includes('npm')) return 'npm'
  if (userAgent.includes('yarn')) return 'yarn'
  if (userAgent.includes('bun')) return 'bun'
  return 'npm'
}
