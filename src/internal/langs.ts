import * as fs from 'node:fs'
import * as path from 'node:path'
import { isSpecialLang } from 'shiki/core'
import { bundledLanguages } from 'shiki/langs'

export const defaultLangs = [
  'ansi',
  'bash',
  'html',
  'js',
  'json',
  'jsx',
  'markdown',
  'md',
  'mdx',
  'plaintext',
  'rust',
  'sol',
  'solidity',
  'ts',
  'tsx',
  'zsh',
]

const warnedLangs = new Set<string>()

/**
 * Scans MDX/MD files in a directory and extracts code block language identifiers.
 * This enables faster Shiki cold starts by only loading languages that are actually used.
 * Languages Shiki can't load are skipped, since preloading one fails the whole highlighter.
 */
export function infer(options: inferLangs.Options): string[] {
  const { langAlias, rootDir, srcDir, pagesDir } = options

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
        const lang = match[1]?.toLowerCase()
        if (!lang) continue
        if (
          Object.hasOwn(bundledLanguages, lang) ||
          isSpecialLang(lang) ||
          Object.hasOwn(langAlias ?? {}, lang)
        )
          langs.add(lang)
        else warnUnknownLang(lang, file)
      }
    }
  } catch {}

  return [...langs]
}

function warnUnknownLang(lang: string, file: string) {
  const key = `${lang}:${file}`
  if (warnedLangs.has(key)) return
  warnedLangs.add(key)
  console.warn(
    `[vocs] Code block language "${lang}" in "${file}" is not bundled with Shiki, so it renders as plain text. Use \`codeHighlight.langs\` to load a custom grammar.`,
  )
}

export declare namespace inferLangs {
  export type Options = {
    langAlias?: Record<string, string> | undefined
    pagesDir: string
    rootDir: string
    srcDir: string
  }
}
