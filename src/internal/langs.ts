import * as fs from 'node:fs'
import * as path from 'node:path'

export const defaultLangs = [
  'html',
  'markdown',
  'ts',
  'tsx',
  'js',
  'jsx',
  'json',
  'md',
  'mdx',
  'plaintext',
  'rust',
  'solidity',
  'bash',
  'zsh',
]

/**
 * Scans MDX/MD files in a directory and extracts code block language identifiers.
 * This enables faster Shiki cold starts by only loading languages that are actually used.
 */
export function infer(options: inferLangs.Options): string[] {
  const { rootDir, srcDir, pagesDir } = options

  const cwd = path.join(rootDir, srcDir, pagesDir)

  const langs = new Set(defaultLangs)
  const codeBlockRegex = /```(\w+)/g

  try {
    const files = fs.globSync('**/*.{md,mdx}', { cwd })

    for (const file of files) {
      const content = fs.readFileSync(path.join(cwd, file), 'utf-8')
      let match: RegExpExecArray | null
      // biome-ignore lint/suspicious/noAssignInExpressions: _
      while ((match = codeBlockRegex.exec(content)) !== null) {
        const lang = match[1]
        if (lang) langs.add(lang.toLowerCase())
      }
    }
  } catch {}

  return [...langs]
}

export declare namespace inferLangs {
  export type Options = {
    pagesDir: string
    rootDir: string
    srcDir: string
  }
}
