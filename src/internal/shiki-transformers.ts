import { createCommentNotationTransformer } from '@shikijs/transformers'
import { createTransformerFactory, type TransformerTwoslashOptions } from '@shikijs/twoslash/core'
import type { ShikiTransformer } from '@shikijs/types'
import { createTwoslasher, type TwoslashInstance } from 'twoslash'

type TransformerTwoslashIndexOptions = TransformerTwoslashOptions

import * as Snippets from './snippets.js'
import * as Renderer from './twoslash/renderer.js'
import * as TypesCache from './twoslash/types-cache.js'

export {
  transformerNotationDiff as notationDiff,
  transformerNotationFocus as notationFocus,
  transformerNotationHighlight as notationHighlight,
  transformerNotationWordHighlight as notationWordHighlight,
  transformerRemoveNotationEscape as removeNotationEscape,
} from '@shikijs/transformers'

/**
 * Shiki transformer that enables collapsible code regions.
 *
 * Detects `// [!code collapse]` or `// [!code collapse:N]` annotations and marks
 * lines for client-side collapse behavior.
 *
 * - `// [!code collapse]` - Collapses all lines from this point to the end
 * - `// [!code collapse:5]` - Collapses 5 lines starting from the next line
 * - `// [!code collapse collapsed]` - Starts collapsed (default is expanded)
 */
export function notationCollapse(): ShikiTransformer[] {
  type Element = import('hast').Element

  const collapseRegions = new Map<number, { count: number; collapsed: boolean }>()

  const detector = createCommentNotationTransformer(
    'vocs:notation-collapse-detect',
    /\[!code collapse(?::(\d+))?(?:\s+(collapsed))?\]/,
    (match, _line, _commentNode, lines, index) => {
      const count = match[1] ? Number.parseInt(match[1], 10) : lines.length - index - 1
      const collapsed = match[2] === 'collapsed'
      collapseRegions.set(index, { count, collapsed })
      return true
    },
    'v3',
  )

  const applier: ShikiTransformer = {
    name: 'vocs:notation-collapse-apply',
    code(code) {
      if (collapseRegions.size === 0) return

      const lines = code.children.filter((x) => x.type === 'element') as Element[]
      let regionId = 0

      for (const [triggerIndex, { count, collapsed }] of collapseRegions) {
        const id = `collapse-${regionId++}`
        const triggerLine = lines[triggerIndex]
        if (!triggerLine) continue

        triggerLine.properties = {
          ...triggerLine.properties,
          'data-v-collapse-trigger': id,
          'data-v-collapsed': collapsed ? '' : undefined,
        }

        const endIndex = Math.min(triggerIndex + count, lines.length - 1)
        for (let j = triggerIndex + 1; j <= endIndex; j++) {
          const contentLine = lines[j]
          if (!contentLine) continue
          contentLine.properties = {
            ...contentLine.properties,
            'data-v-collapse-content': id,
          }
        }

        this.addClassToHast(code, 'has-collapse')
      }

      collapseRegions.clear()
    },
  }

  return [detector, applier]
}

let twoslasher: TwoslashInstance

export function twoslash(options: twoslash.Options): ShikiTransformer {
  const { cacheDir } = options
  const {
    explicitTrigger = true,
    disableTriggers,
    filter,
    includesMap,
    langAlias,
    langs,
    renderer = Renderer.rich(),
    throws = true,
    twoslashOptions,
    typesCache = TypesCache.fs({ dir: cacheDir }),
  } = options

  // singleton twoslasher saves ~1.5s cold start time
  twoslasher ??= createTwoslasher({
    ...twoslashOptions,
    compilerOptions: {
      ...(twoslashOptions?.compilerOptions ?? {}),
      moduleResolution: 100, // bundler,
    },
  })

  return createTransformerFactory(
    twoslasher,
    renderer,
  )({
    explicitTrigger,
    onShikiError() {},
    onTwoslashError() {},
    throws,
    typesCache,
    ...(disableTriggers ? { disableTriggers } : {}),
    ...(filter ? { filter } : {}),
    ...(includesMap ? { includesMap } : {}),
    ...(langAlias ? { langAlias } : {}),
    ...(langs ? { langs } : {}),
  })
}

export declare namespace twoslash {
  export type Options = TransformerTwoslashIndexOptions & { cacheDir?: string | undefined }
}

export function emptyLine(): ShikiTransformer {
  return {
    name: 'empty-line',
    root(hast) {
      // biome-ignore lint/suspicious/noExplicitAny: _
      const code = (hast.children[0] as any)?.children[0]
      if (!code) return
      // biome-ignore lint/suspicious/noExplicitAny: _
      const lines = code.children as any[]
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i]
        if (!line.properties || line.children?.[0]) continue
        line.properties['data-empty-line'] = true
        line.children = [{ type: 'text', value: ' ' }]
      }
    },
  }
}

export function lineNumbers(): ShikiTransformer {
  return createCommentNotationTransformer(
    'vocs:line-numbers',
    /\s*\[!code line-numbers\]/,
    function () {
      this.addClassToHast(this.code, 'line-numbers')
      return true
    },
    'v3',
  )
}

export function tagLine(): ShikiTransformer {
  return {
    name: 'tag-line',
    root(hast) {
      // biome-ignore lint/suspicious/noExplicitAny: _
      const lines = (hast.children[0] as any)?.children[0]?.children
      if (!lines) return

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const classes = line.properties?.class || ''
        if (classes.includes('twoslash-tag-line') && classes.includes('tag-line')) {
          lines.splice(i - 1, 0, line)
          lines.splice(i + 1, 1)
          if (i + 1 === lines.length) lines.splice(i, 1)
        }
      }
    },
  }
}

/**
 * Shiki transformer that enables regex-based inline code folding.
 *
 * Detects `// [!code fold /pattern/flags]` annotations and wraps matching text
 * in fold markers for client-side collapse behavior.
 *
 * - `// [!code fold /somePattern/]` - Folds all occurrences of `somePattern`
 * - `// [!code fold /pattern/gi]` - Folds with global + case-insensitive flags
 */
export function notationFold(): ShikiTransformer[] {
  type Element = import('hast').Element
  type Text = import('hast').Text

  const FOLD_START = '\u200B\u200CFOLD_S\u200B\u200C'
  const FOLD_END = '\u200B\u200CFOLD_E\u200B\u200C'
  const FOLD_MARKER_RE = new RegExp(`${FOLD_START}|${FOLD_END}`)

  const foldPatterns: Array<{ pattern: RegExp }> = []

  const detector = createCommentNotationTransformer(
    'vocs:notation-fold-detect',
    /\[!code fold \/(.+?)\/([gimsuvy]*)\]/,
    (match) => {
      const [, patternStr, flags] = match as [string, string, string]
      try {
        foldPatterns.push({ pattern: new RegExp(patternStr, flags || 'g') })
      } catch {}
      return true
    },
    'v3',
  )

  const applier: ShikiTransformer = {
    name: 'vocs:notation-fold-apply',
    code(code) {
      if (foldPatterns.length === 0) return

      const lines = code.children.filter((x) => x.type === 'element') as Element[]
      for (const { pattern } of foldPatterns) {
        for (const line of lines) {
          processLineForFold(line, pattern)
        }
      }

      this.addClassToHast(code, 'has-fold')
      foldPatterns.length = 0
    },
  }

  return [detector, applier]

  function collectTextSegments(
    element: Element,
    segments: Array<{ text: string; node: Text; offset: number }>,
    offset = 0,
  ): number {
    for (const child of element.children) {
      if (child.type === 'text') {
        const textNode = child as Text
        segments.push({ text: textNode.value, node: textNode, offset })
        offset += textNode.value.length
      } else if (child.type === 'element') {
        offset = collectTextSegments(child as Element, segments, offset)
      }
    }
    return offset
  }

  function processLineForFold(line: Element, pattern: RegExp): void {
    const segments: Array<{ text: string; node: Text; offset: number }> = []
    collectTextSegments(line, segments)

    const fullText = segments.map((s) => s.text).join('')
    const regex = new RegExp(
      pattern.source,
      pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`,
    )

    const matches: Array<{ start: number; end: number }> = []
    let match: RegExpExecArray | null
    // biome-ignore lint/suspicious/noAssignInExpressions: _
    while ((match = regex.exec(fullText)) !== null) {
      matches.push({ start: match.index, end: match.index + match[0].length })
      if (!pattern.flags.includes('g')) break
    }

    if (matches.length === 0) return

    for (const seg of segments) {
      const segStart = seg.offset
      const segEnd = seg.offset + seg.text.length

      for (const m of matches) {
        if (m.start < segEnd && m.end > segStart) {
          const overlapStart = Math.max(m.start, segStart) - segStart
          const overlapEnd = Math.min(m.end, segEnd) - segStart
          seg.node.value = markFoldRange(seg.node.value, overlapStart, overlapEnd)
        }
      }
    }

    applyFoldMarkers(line)
  }

  function markFoldRange(text: string, start: number, end: number): string {
    return text.slice(0, start) + FOLD_START + text.slice(start, end) + FOLD_END + text.slice(end)
  }

  function applyFoldMarkers(element: Element): void {
    const newChildren: (Element | Text)[] = []

    for (const child of element.children) {
      if (child.type === 'text') {
        const textNode = child as Text
        newChildren.push(...splitByMarkers(textNode.value))
      } else if (child.type === 'element') {
        const elem = child as Element
        applyFoldMarkers(elem)
        newChildren.push(elem)
      }
    }

    element.children = newChildren
  }

  function splitByMarkers(text: string): (Element | Text)[] {
    const results: (Element | Text)[] = []
    const parts = text.split(FOLD_MARKER_RE)
    let inFold = false
    let idx = 0

    for (const part of parts) {
      if (part.length > 0) {
        if (inFold) {
          results.push({
            type: 'element',
            tagName: 'span',
            properties: { 'data-v-fold': '' },
            children: [{ type: 'text', value: part }],
          })
        } else {
          results.push({ type: 'text', value: part })
        }
      }
      if (idx < parts.length - 1) {
        const markerPos = text.indexOf(inFold ? FOLD_END : FOLD_START)
        if (markerPos !== -1) inFold = !inFold
      }
      idx++
    }

    return results
  }
}

/**
 * Shiki transformer that adds a title to code blocks.
 */
export function title(): ShikiTransformer {
  return {
    name: 'title',
    root(hast) {
      const titleRegex = /title="(.*)"|\[(.*)\]/
      const titleMatch = this.options.meta?.__raw?.match(titleRegex)
      if (!titleMatch) return

      const title = titleMatch[1] || titleMatch[2]
      // biome-ignore lint/suspicious/noExplicitAny: _
      const child = hast.children[0] as any
      hast.children = [
        {
          ...child,
          properties: {
            ...child.properties,
            'data-title': title,
            ...(this.options.lang && { 'data-v-lang': this.options.lang }),
          },
        },
      ]
    },
  }
}

/**
 * Shiki transformer that processes `// [!include ...]` markers for physical files.
 * Physical files use `~` prefix to indicate root-relative paths.
 */
export function notationInclude(options: notationInclude.Options): ShikiTransformer {
  const { srcDir, rootDir } = options
  const getSource = Snippets.createPhysicalSourceGetter({ srcDir, rootDir })

  return {
    name: 'vocs:notation-include',
    enforce: 'pre',
    preprocess(code) {
      if (!code) return code
      return Snippets.processIncludes({ code, getSource })
    },
  }
}

export declare namespace notationInclude {
  type Options = { srcDir: string; rootDir: string }
}

/**
 * Shiki transformer that handles shell prompt prefixes.
 * - Wraps prompt symbols ($, #, %, >) in uncopiable decorations
 * - Adds data attributes for per-line copy functionality
 */
export function shellPrompt(options: shellPrompt.Options = {}): ShikiTransformer {
  type Element = import('hast').Element
  type Text = import('hast').Text

  const promptChars = new Set(options.promptChars ?? ['$', '#', '%', '>'])
  const shellLanguages = new Set(
    options.languages ?? [
      'bash',
      'console',
      'fish',
      'nu',
      'nushell',
      'powershell',
      'ps',
      'ps1',
      'sh',
      'shell',
      'terminal',
      'zsh',
    ],
  )

  return {
    name: 'vocs:shell-prompt',
    pre(node) {
      const lang = this.options.lang
      if (!lang || !shellLanguages.has(lang)) return
      node.properties['data-v-shell'] = ''
    },
    code(node) {
      const lang = this.options.lang
      if (!lang || !shellLanguages.has(lang)) return

      const lines = node.children.filter((x) => x.type === 'element') as Element[]

      for (const line of lines) {
        if (line.children.length === 0) continue

        const firstChild = line.children[0]
        if (!firstChild || firstChild.type !== 'element') continue

        const span = firstChild as Element
        const textNode = span.children[0] as Text | undefined
        if (!textNode || textNode.type !== 'text') continue

        const text = textNode.value.trim()

        if (promptChars.has(text)) {
          const secondChild = line.children[1]
          if (secondChild?.type === 'element') {
            const secondSpan = secondChild as Element
            const secondTextNode = secondSpan.children[0] as Text | undefined
            if (secondTextNode?.type === 'text' && secondTextNode.value.startsWith(' ')) {
              textNode.value = `${text} `
              secondTextNode.value = secondTextNode.value.slice(1)
            }
          }
          span.properties = { ...span.properties, 'data-v-shell-prompt': '' }
          line.properties = { ...line.properties, 'data-v-shell-line': '' }
        }
      }
    },
  }
}

export declare namespace shellPrompt {
  type Options = {
    /** Prompt characters to detect (e.g., '$', '#'). @default ['$', '#', '%', '>'] */
    promptChars?: string[] | undefined
    /** Shell languages to process. @default ['bash', 'console', 'fish', 'powershell', 'ps', 'ps1', 'sh', 'shell', 'terminal', 'zsh'] */
    languages?: string[] | undefined
  }
}

/**
 * Transformer that detects and renders custom comment tags in code blocks.
 *
 * Detects tag patterns in comments and replaces them with styled tag divs.
 *
 * Supported tags: @error, @log, @warn, @annotate
 *
 * Examples:
 * - // @error: Custom error message
 * - # @log: Custom log message
 * - -- @warn: Custom warning message
 */
export function customTag(): ShikiTransformer {
  const customTags = ['error', 'log', 'warn', 'annotate'] as const
  const tagPattern = new RegExp(`@(${customTags.join('|')}):\\s*(.+)`)

  type Element = import('hast').Element
  type Text = import('hast').Text

  function getTextContent(element: Element): string {
    let text = ''
    for (const child of element.children) {
      if (child.type === 'text') text += child.value
      else if (child.type === 'element') text += getTextContent(child as Element)
    }
    return text
  }

  return {
    name: 'vocs:custom-tag',
    preprocess(code, options) {
      const meta = options.meta?.__raw || ''
      if (meta.includes('twoslash')) return code
      return code
    },
    code(code) {
      const lines = code.children.filter((x) => x.type === 'element') as Element[]
      const tagsToInsert: Array<{ afterIndex: number; type: string; message: string }> = []
      const linesToRemove: Element[] = []

      lines.forEach((line, index) => {
        const lineText = getTextContent(line)
        const match = lineText.match(tagPattern)
        if (!match) return

        const [, tagType, message] = match as [string, string, string]
        tagsToInsert.push({
          afterIndex: index,
          type: tagType,
          message: message.trim(),
        })
        linesToRemove.push(line)
      })

      // remove lines with tags
      for (const line of linesToRemove) {
        const index = code.children.indexOf(line)
        if (index === -1) continue
        const nextLine = code.children[index + 1]
        let removeLength = 1
        // also remove the newline after the line
        if (nextLine?.type === 'text' && nextLine.value === '\n') removeLength = 2
        code.children.splice(index, removeLength)
      }

      // adjust indices for removed lines
      const adjustedTags = tagsToInsert.map((tag) => {
        let adjustedIndex = tag.afterIndex
        for (const removedLine of linesToRemove) {
          const removedIndex = lines.indexOf(removedLine)
          if (removedIndex !== -1 && removedIndex <= tag.afterIndex) adjustedIndex--
        }
        return { ...tag, afterIndex: adjustedIndex }
      })

      // insert tag divs (in reverse order to maintain indices)
      const sortedTags = adjustedTags.sort((a, b) => b.afterIndex - a.afterIndex)

      for (const tag of sortedTags) {
        const currentLines = code.children.filter((x) => x.type === 'element') as Element[]
        const targetLine = currentLines[tag.afterIndex]
        if (!targetLine) continue

        const targetIndex = code.children.indexOf(targetLine)
        if (targetIndex === -1) continue

        const targetClasses = targetLine.properties?.['class']
        const existingClasses = Array.isArray(targetClasses)
          ? targetClasses.filter((x) => typeof x === 'string' && x && !x.startsWith('tag-'))
          : typeof targetClasses === 'string'
            ? targetClasses.split(' ').filter((x) => x && !x.startsWith('tag-'))
            : []

        const tagLine: Element = {
          type: 'element',
          tagName: 'span',
          properties: {
            class: [
              ...existingClasses,
              'line',
              'twoslash-tag-line',
              `twoslash-tag-${tag.type}-line`,
            ],
          },
          children: [{ type: 'text', value: tag.message }],
        }

        // insert after the target line + its newline
        const nextIndex = targetIndex + 1
        if (code.children[nextIndex]?.type === 'text' && code.children[nextIndex]?.value === '\n')
          code.children.splice(nextIndex + 1, 0, tagLine, { type: 'text', value: '\n' } as Text)
        else code.children.splice(nextIndex, 0, tagLine, { type: 'text', value: '\n' } as Text)
      }
    },
  }
}

export function sandbox(): ShikiTransformer {
  return {
    name: 'vocs:sandbox',
    root(hast) {
      const meta = this.options.meta?.__raw ?? ''
      if (!meta.includes('sandbox')) return

      const code = this.source
      const deps = extractDeps(code)
      const options = parseSandboxOptions(meta)

      const pre = hast.children[0]
      if (pre && pre.type === 'element' && pre.tagName === 'pre') {
        pre.properties = {
          ...pre.properties,
          'data-sandbox': '',
          'data-sandbox-code': code,
          'data-sandbox-deps': JSON.stringify(deps),
          'data-sandbox-auto-run': options.autoRun ? 'true' : 'false',
          'data-sandbox-lang': this.options.lang ?? 'ts',
        }
      }
    },
  }
}

function parseSandboxOptions(meta: string): sandbox.Options {
  const options: sandbox.Options = {
    autoRun: false,
    showLineNumbers: true,
    showTabs: true,
  }

  if (meta.includes('autorun')) options.autoRun = true

  const lineNumbersMatch = meta.match(/lineNumbers=(true|false)/)
  if (lineNumbersMatch) options.showLineNumbers = lineNumbersMatch[1] === 'true'

  const tabsMatch = meta.match(/tabs=(true|false)/)
  if (tabsMatch) options.showTabs = tabsMatch[1] === 'true'

  return options
}

function extractDeps(code: string): Record<string, string> {
  const deps: Record<string, string> = {}
  const importRegex = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g

  for (const match of code.matchAll(importRegex)) {
    const importPath = match[1]
    if (!importPath || importPath.startsWith('.') || importPath.startsWith('/')) continue

    const pkgName = importPath.startsWith('@')
      ? importPath.split('/').slice(0, 2).join('/')
      : importPath.split('/')[0]

    if (pkgName && !deps[pkgName]) deps[pkgName] = 'latest'
  }

  return deps
}

export declare namespace sandbox {
  type Options = {
    autoRun: boolean
    showLineNumbers: boolean
    showTabs: boolean
  }
}
