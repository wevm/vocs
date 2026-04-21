import { createRequire } from 'node:module'
import * as path from 'node:path'
import { createCommentNotationTransformer } from '@shikijs/transformers'
import { createTransformerFactory, type TransformerTwoslashOptions } from '@shikijs/twoslash/core'
import type { ShikiTransformer } from '@shikijs/types'
import { addClassToHast } from 'shiki'
import { createTwoslasher, type TS, type TwoslashInstance } from 'twoslash/core'

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

const notationBlockStartRegex =
  /^\s*(?:\/\/|\/\*|<!--|#|--)\s+\[!code\s+(hl|focus):start\]\s*(?:\*\/|-->)?\s*$/
const notationBlockEndRegex =
  /^\s*(?:\/\/|\/\*|<!--|#|--)\s+\[!code\s+(hl|focus):end\]\s*(?:\*\/|-->)?\s*$/

/**
 * Transformer that handles block-level code annotations for highlight and focus.
 *
 * Supports start/end markers:
 * - // [!code hl:start] ... // [!code hl:end]
 * - // [!code focus:start] ... // [!code focus:end]
 *
 * Works with various comment styles: //, /* *\/, <!--  -->, #, --
 */
export function notationBlock(options: notationBlock.Options = {}): ShikiTransformer {
  type Element = import('hast').Element
  type ElementContent = import('hast').ElementContent

  const {
    highlightClass = 'highlighted',
    focusClass = 'focused',
    focusActivePreClass = 'has-focused',
  } = options

  return {
    name: 'vocs:notation-block',
    code(code) {
      const children = code.children
      const lines = children.filter((i) => i.type === 'element') as Element[]
      const removeSet = new Set<ElementContent>()

      let hlDepth = 0
      let focusDepth = 0
      let hasFocus = false

      for (const line of lines) {
        const lineText = getLineText(line)

        const startMatch = lineText.match(notationBlockStartRegex)
        if (startMatch) {
          const blockType = startMatch[1]
          if (blockType === 'hl') {
            hlDepth++
          } else {
            focusDepth++
          }
          markLineForRemoval(line, code, removeSet)
          continue
        }

        const endMatch = lineText.match(notationBlockEndRegex)
        if (endMatch) {
          const blockType = endMatch[1]
          if (blockType === 'hl') {
            hlDepth = Math.max(0, hlDepth - 1)
          } else {
            focusDepth = Math.max(0, focusDepth - 1)
          }
          markLineForRemoval(line, code, removeSet)
          continue
        }

        if (hlDepth > 0) {
          addClassToHast(line, highlightClass)
        }
        if (focusDepth > 0) {
          addClassToHast(line, focusClass)
          hasFocus = true
        }
      }

      if (hasFocus && this.pre) {
        addClassToHast(this.pre, focusActivePreClass)
      }

      code.children = children.filter((n) => !removeSet.has(n))
    },
  }

  function getLineText(line: Element): string {
    let text = ''
    for (const child of line.children) {
      if (child.type === 'text') {
        text += child.value
      } else if (child.type === 'element') {
        text += getLineText(child as Element)
      }
    }
    return text
  }

  function markLineForRemoval(line: Element, code: Element, removeSet: Set<ElementContent>): void {
    removeSet.add(line)
    const lineIndex = code.children.indexOf(line)
    const nextNode = code.children[lineIndex + 1]
    if (
      nextNode &&
      nextNode.type === 'text' &&
      (nextNode.value === '\n' || nextNode.value === '\r\n')
    ) {
      removeSet.add(nextNode)
    }
  }
}

export declare namespace notationBlock {
  type Options = {
    /** Class to apply to highlighted lines. @default 'highlighted' */
    highlightClass?: string | undefined
    /** Class to apply to focused lines. @default 'focused' */
    focusClass?: string | undefined
    /** Class added to the <pre> element when focus blocks are present. @default 'has-focused' */
    focusActivePreClass?: string | undefined
  }
}

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

export type TwoslashError = {
  message: string
  code: string
  lang: string
  meta?: string | undefined
}
export const twoslashErrors: TwoslashError[] = []

const cwd = typeof process !== 'undefined' && typeof process.cwd === 'function' ? process.cwd() : ''
const require = createRequire(import.meta.url)

let twoslasher: TwoslashInstance
let typescript: TS | undefined

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
    typesCache = TypesCache.fs({ dir: cacheDir ? path.join(cacheDir, 'twoslash') : undefined }),
  } = options

  const lazyTwoslasher = (
    code: string,
    lang?: string,
    executeOptions?: Parameters<TwoslashInstance>[2],
  ) => {
    if (!twoslasher) {
      const tsModule = twoslashOptions?.tsModule ?? getTypeScript()

      // singleton twoslasher saves ~1.5s cold start time
      twoslasher = createTwoslasher({
        ...twoslashOptions,
        tsModule,
        vfsRoot: twoslashOptions?.vfsRoot ?? cwd,
        compilerOptions: {
          // @typescript/vfs still uses deprecated baseUrl behavior, but TS 5 only accepts 5.0 here.
          ignoreDeprecations: Number.parseInt(tsModule.versionMajorMinor, 10) >= 6 ? '6.0' : '5.0',
          moduleResolution: 100, // bundler (default, can be overridden)
          preserveSymlinks: false, // needed for monorepo/workspace symlinks
          types: ['node'], // include node types by default (process.env, etc.)
          ...(twoslashOptions?.compilerOptions ?? {}),
        },
      })
    }

    return twoslasher(code, lang, executeOptions)
  }

  return createTransformerFactory(
    lazyTwoslasher,
    renderer,
  )({
    explicitTrigger,
    throws,
    typesCache,
    onTwoslashError(error, code, lang, options) {
      if (!throws) return
      const message = error instanceof Error ? error.message : String(error)
      const meta = options?.meta?.__raw
      twoslashErrors.push({ message, code, lang, meta })
    },
    onShikiError(error, code, lang) {
      if (!throws) return
      const message = error instanceof Error ? error.message : String(error)
      twoslashErrors.push({ message, code, lang })
    },
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

function getTypeScript(): TS {
  if (typescript) return typescript

  try {
    typescript = require('typescript') as TS
    return typescript
  } catch {
    throw new Error(
      'Using twoslash code blocks requires `typescript` to be installed in your project.',
    )
  }
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
 * Shiki transformer that adds a wrap toggle button to code blocks.
 * Enabled via `// [!code show-wrap]` comment.
 */
export function showWrap(): ShikiTransformer {
  type Element = import('hast').Element

  const pattern = /^\s*(?:\/\/|\/\*|<!--|#|--)\s*\[!code show-wrap\]\s*(?:\*\/|-->)?\s*$/

  function getTextContent(element: Element): string {
    let text = ''
    for (const child of element.children) {
      if (child.type === 'text') text += child.value
      else if (child.type === 'element') text += getTextContent(child as Element)
    }
    return text
  }

  return {
    name: 'vocs:show-wrap',
    code(code) {
      const lines = code.children.filter((x) => x.type === 'element') as Element[]

      for (const line of lines) {
        const lineText = getTextContent(line)
        if (!pattern.test(lineText)) continue

        // Add attribute to pre element
        // biome-ignore lint/suspicious/noExplicitAny: _
        const pre = this.pre as any
        pre.properties = { ...pre.properties, 'data-v-show-wrap': '' }

        // Remove the line and following newline
        const index = code.children.indexOf(line)
        if (index === -1) continue
        const nextNode = code.children[index + 1]
        let removeLength = 1
        if (nextNode?.type === 'text' && nextNode.value === '\n') removeLength = 2
        code.children.splice(index, removeLength)
        break
      }
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

        // Check if line starts with a prompt character
        // Case 1: Prompt is isolated in its own span (e.g., "$")
        // Case 2: Prompt is at start of span followed by space (e.g., "$ forge build")
        const startsWithPrompt =
          promptChars.has(text) || [...promptChars].some((p) => text.startsWith(`${p} `))

        if (startsWithPrompt) {
          if (promptChars.has(text)) {
            // Case 1: Prompt is isolated — move trailing space from next span if present
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
          } else {
            // Case 2: Prompt is inline — split the span into prompt + command
            const prompt = [...promptChars].find((p) => text.startsWith(`${p} `)) as string
            const commandText = textNode.value
              .slice(textNode.value.indexOf(prompt) + prompt.length + 1)
              .trimStart()
            const leadingWs = textNode.value.slice(0, textNode.value.indexOf(prompt))

            // Create prompt span with shell prompt styling
            const promptSpan: Element = {
              type: 'element',
              tagName: 'span',
              properties: {
                style: 'color:var(--shiki-token-function)',
                'data-v-shell-prompt': '',
              },
              children: [{ type: 'text', value: `${leadingWs}${prompt} ` }],
            }

            // Create command span with shell command styling
            const commandSpan: Element = {
              type: 'element',
              tagName: 'span',
              properties: { style: 'color:var(--shiki-token-string)' },
              children: [{ type: 'text', value: commandText }],
            }

            // Replace line children with prompt + command + rest of children
            const spanIndex = line.children.indexOf(span)
            const newChildren = [
              ...line.children.slice(0, spanIndex),
              promptSpan,
              ...(commandText.length > 0 ? [commandSpan] : []),
              ...line.children.slice(spanIndex + 1),
            ]
            line.children = newChildren
          }
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
 * Shiki transformer that handles [!code ...] annotations on bash lines
 * where backslash-space before `#` prevents the standard comment-based
 * transformers from recognizing them.
 *
 * Example: `--flag \ # [!code hl]` → marks line as highlighted, outputs `--flag \`
 */
export function shellNotation(): ShikiTransformer {
  // Match lines ending with: \ # [!code <annotation>]
  // where annotation is hl, focus, ++, --, etc.
  const shellAnnotationRegex = /^(.*\\\s*)#\s*\[!code\s+(hl|focus|\+\+|--)\]\s*$/

  return {
    name: 'vocs:shell-notation',
    preprocess(code, options) {
      const lang = options.lang
      const shellLanguages = new Set([
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
      ])
      if (!lang || !shellLanguages.has(lang)) return code

      const lines = code.split('\n')
      const annotations: Array<{ lineIndex: number; type: string }> = []
      const processedLines: string[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line === undefined) continue
        const match = line.match(shellAnnotationRegex)
        if (match) {
          const [, prefix, type] = match as [string, string, string]
          processedLines.push(prefix.trimEnd())
          annotations.push({ lineIndex: i, type })
        } else {
          processedLines.push(line)
        }
      }

      if (annotations.length === 0)
        return code

        // Store annotations for the code hook to apply
        // biome-ignore lint/suspicious/noExplicitAny: _
      ;(this as any).__shellAnnotations = annotations

      return processedLines.join('\n')
    },
    code(code) {
      // biome-ignore lint/suspicious/noExplicitAny: _
      const annotations = (this as any).__shellAnnotations as
        | Array<{ lineIndex: number; type: string }>
        | undefined
      if (!annotations || annotations.length === 0) return

      type Element = import('hast').Element
      const lines = code.children.filter((x) => x.type === 'element') as Element[]

      for (const { lineIndex, type } of annotations) {
        const line = lines[lineIndex]
        if (!line) continue

        const classMap: Record<string, string> = {
          hl: 'highlighted',
          focus: 'focused',
          '++': 'diff add',
          '--': 'diff remove',
        }
        const cls = classMap[type]
        if (cls) addClassToHast(line, cls)

        if (type === 'focus' && this.pre) {
          addClassToHast(this.pre, 'has-focused')
        }
      }
    },
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

/**
 * Transformer that adds `data-language` attribute to code elements.
 *
 * For @shikijs/rehype inline mode, the highlighter outputs standard <pre><code>
 * structure, then the rehype plugin changes <pre> to <span>. This transformer
 * adds the language to the <code> element so it's available for styling.
 */
export function inlineLanguage(): ShikiTransformer {
  return {
    name: 'vocs:inline-language',
    code(node) {
      const lang = this.options.lang
      if (!lang || lang === 'plaintext') return
      node.properties['data-language'] = lang
    },
  }
}
