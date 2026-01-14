import * as child_process from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'

import * as clack from '@clack/prompts'
import pc from 'picocolors'

export async function init() {
  clack.intro(pc.cyan('Create a new Vocs project'))

  try {
    const projectName = await clack.text({
      message: 'Project name',
      placeholder: 'my-docs',
      validate: (value: string | undefined) => {
        if (!value) return 'Project name is required'
        if (!/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(value))
          return 'Invalid project name. Must be lowercase, can contain hyphens, and optionally scoped with @org/'
        return
      },
    })

    if (clack.isCancel(projectName)) {
      clack.cancel('Operation cancelled')
      process.exit(0)
    }

    const targetPath = path.resolve(process.cwd(), projectName)

    if (fs.existsSync(targetPath)) {
      clack.cancel(`Directory ${projectName} already exists`)
      process.exit(1)
    }

    const spinner = clack.spinner()
    spinner.start('Creating project')

    const templatePath = ['.', '..']
      .map((dir) => path.join(import.meta.dirname, dir, 'template'))
      .find((p) => fs.existsSync(p))

    if (!templatePath) throw new Error('Template directory not found')

    copyDir(templatePath, targetPath)

    const packageJsonPath = path.join(targetPath, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    packageJson.name = projectName
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf-8')

    spinner.message('Initializing git repository')
    try {
      child_process.execSync('git init', { cwd: targetPath, stdio: 'ignore' })
      child_process.execSync('git add .', { cwd: targetPath, stdio: 'ignore' })
      child_process.execSync('git commit -m "Initial commit"', {
        cwd: targetPath,
        stdio: 'ignore',
      })
    } catch {}

    spinner.stop('Project created successfully')

    clack.note(
      `${pc.dim('$')} cd ${projectName}
${pc.dim('$')} npm install
${pc.dim('$')} npm run dev`,
      'Next steps',
    )

    clack.outro(pc.cyan('Happy documenting! 📝'))
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    clack.cancel(`Failed to create project: ${errorMessage}`)
    process.exit(1)
  }
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    // Handle ~-prefixed files → .-prefixed (e.g., ~gitignore → .gitignore)
    const destName = entry.name.startsWith('~') ? `.${entry.name.slice(1)}` : entry.name
    const destPath = path.join(dest, destName)

    if (entry.isDirectory()) copyDir(srcPath, destPath)
    else fs.copyFileSync(srcPath, destPath)
  }
}
