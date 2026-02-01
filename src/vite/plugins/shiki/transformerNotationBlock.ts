import type { Element, ElementContent } from 'hast'
import { addClassToHast, type ShikiTransformer } from 'shiki'

export interface TransformerNotationBlockOptions {
  /**
   * Class to apply to highlighted lines
   * @default 'highlighted'
   */
  highlightClass?: string
  /**
   * Class to apply to focused lines
   * @default 'focused'
   */
  focusClass?: string
  /**
   * Class added to the <pre> element when focus blocks are present
   * @default 'has-focused'
   */
  focusActivePreClass?: string
}

const startRegex = /^\s*(?:\/\/|\/\*|<!--|#|--)\s+\[!code\s+(hl|focus):start\]\s*(?:\*\/|-->)?\s*$/
const endRegex = /^\s*(?:\/\/|\/\*|<!--|#|--)\s+\[!code\s+(hl|focus):end\]\s*(?:\*\/|-->)?\s*$/

/**
 * Transformer that handles block-level code annotations for highlight and focus.
 *
 * Supports start/end markers:
 * - // [!code hl:start] ... // [!code hl:end]
 * - // [!code focus:start] ... // [!code focus:end]
 *
 * Works with various comment styles: //, /* *\/, <!--  -->, #, --
 */
export function transformerNotationBlock(
  options: TransformerNotationBlockOptions = {},
): ShikiTransformer {
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

        const startMatch = lineText.match(startRegex)
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

        const endMatch = lineText.match(endRegex)
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
