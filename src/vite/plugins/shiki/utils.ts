import type { Element, Text } from 'hast'
import { addClassToHast, type ShikiTransformer, type ShikiTransformerContext } from 'shiki'

export interface TransformerNotationMapOptions {
  classMap?: Record<string, string | string[]>
  /**
   * Class added to the <pre> element when the current code has diff
   */
  classActivePre?: string
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function transformerNotationMap(
  options: TransformerNotationMapOptions = {},
  name = '@shikijs/transformers:notation-map',
): ShikiTransformer {
  const { classMap = {}, classActivePre = undefined } = options

  return createCommentNotationTransformer(
    name,
    new RegExp(
      `\\s*(?://|/\\*|<!--|#)\\s+\\[!code (${Object.keys(classMap).map(escapeRegExp).join('|')})(:\\d+)?\\]\\s*(?:\\*/|-->)?`,
    ),
    function ([_, match, range = ':1'], _line, _comment, lines, index) {
      const lineNum = Number.parseInt(range.slice(1), 10)
      lines.slice(index, index + lineNum).forEach((line) => {
        addClassToHast(line, classMap[match])
      })
      if (classActivePre) addClassToHast(this.pre, classActivePre)
      return true
    },
  )
}

export function createCommentNotationTransformer(
  name: string,
  regex: RegExp,
  onMatch: (
    this: ShikiTransformerContext,
    match: string[],
    line: Element,
    commentNode: Element,
    lines: Element[],
    index: number,
  ) => boolean,
  removeEmptyLines = false,
): ShikiTransformer {
  return {
    name,
    code(code) {
      const lines = code.children.filter((i) => i.type === 'element') as Element[]
      const linesToRemove: (Element | Text)[] = []
      lines.forEach((line, idx) => {
        let nodeToRemove: Element | undefined

        for (const child of line.children) {
          if (child.type !== 'element') continue
          const text = child.children[0]
          if (text.type !== 'text') continue

          let replaced = false
          text.value = text.value.replace(regex, (...match) => {
            if (onMatch.call(this, match, line, child, lines, idx)) {
              replaced = true
              return ''
            }
            return match[0]
          })
          if (replaced && !text.value.trim()) nodeToRemove = child
        }

        if (nodeToRemove) {
          line.children.splice(line.children.indexOf(nodeToRemove), 1)

          // Remove if empty
          if (line.children.length === 0) {
            linesToRemove.push(line)
            if (removeEmptyLines) {
              const next = code.children[code.children.indexOf(line) + 1]
              if (next && next.type === 'text' && next.value === '\n') linesToRemove.push(next)
            }
          }
        }
      })

      for (const line of linesToRemove) code.children.splice(code.children.indexOf(line), 1)
    },
  }
}

export function highlightWordInLine(
  line: Element,
  ignoredElement: Element | null,
  word: string,
  className: string,
): void {
  line.children = line.children.flatMap((span) => {
    if (span.type !== 'element' || span.tagName !== 'span' || span === ignoredElement) return span

    const textNode = span.children[0]

    if (textNode.type !== 'text') return span

    return replaceSpan(span, textNode.value, word, className) ?? span
  })
}

function inheritElement(original: Element, overrides: Partial<Element>): Element {
  return {
    ...original,
    properties: {
      ...original.properties,
    },
    ...overrides,
  }
}

function replaceSpan(
  span: Element,
  text: string,
  word: string,
  className: string,
): Element[] | undefined {
  const index = text.indexOf(word)

  if (index === -1) return

  const createNode = (value: string) =>
    inheritElement(span, {
      children: [
        {
          type: 'text',
          value,
        },
      ],
    })

  const nodes: Element[] = []

  if (index > 0) nodes.push(createNode(text.slice(0, index)))

  const highlightedNode = createNode(word)
  addClassToHast(highlightedNode, className)
  nodes.push(highlightedNode)

  if (index + word.length < text.length) nodes.push(createNode(text.slice(index + word.length)))

  return nodes
}
