import { resolve } from 'node:path'
import { intro, log, outro, text } from '@clack/prompts'
import { default as fs } from 'fs-extra'
import pc from 'picocolors'

export type InitParameters = { name: string }

export async function init(params: InitParameters) {
  intro('Welcome to Vocs!')

  const templateDir = resolve(import.meta.dirname, '../templates/default')

  const displayName =
    params.name ||
    ((await text({
      message: 'Enter the name of your project',
      validate(value) {
        if (!value) return 'Please enter a name.'
        return
      },
    })) as string)
  const name = kebabcase(displayName)

  const destDir = resolve(process.cwd(), name)

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

  // Wrap up
  log.success(`Project successfully scaffolded in ${pc.blue(destDir)}!`)

  const pkgManager = detectPackageManager()

  log.message('Next steps:')
  log.step(`1. ${pc.blue(`cd ./${name}`)} - Navigate to project`)
  log.step(`2. ${pc.blue(pkgManagerInstallCommand(pkgManager))} - Install dependencies`)
  log.step(`3. ${pc.blue(pkgManagerRunCommand(pkgManager, 'dev'))} - Start dev server`)
  log.step(`4. Head to ${pc.blue('http://localhost:5173')}`)

  outro('Happy documenting! 📝')
}

type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun'

function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent
  if (!userAgent) return 'npm'
  if (userAgent.includes('bun')) return 'bun'
  if (userAgent.includes('yarn')) return 'yarn'
  if (userAgent.includes('pnpm')) return 'pnpm'
  if (userAgent.includes('npm')) return 'npm'
  return 'npm'
}

function pkgManagerInstallCommand(pkgManager: PackageManager) {
  if (pkgManager === 'bun') return 'bun install'
  if (pkgManager === 'yarn') return 'yarn'
  if (pkgManager === 'pnpm') return 'pnpm install'
  return 'npm install'
}

function pkgManagerRunCommand(pkgManager: PackageManager, command: string) {
  if (pkgManager === 'bun') return `bun run ${command}`
  if (pkgManager === 'yarn') return `yarn ${command}`
  if (pkgManager === 'pnpm') return `pnpm ${command}`
  return `npm run ${command}`
}

function kebabcase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}
