import type { Element, Text } from 'hast'
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

type BlockType = 'hl' | 'focus'

interface BlockState {
  type: BlockType
  startIndex: number
}

const startRegex = /^\s*(?:\/\/|\/\*|<!--|#|--)\s*\[!code\s+(hl|focus):start\]\s*(?:\*\/|-->)?$/
const endRegex = /^\s*(?:\/\/|\/\*|<!--|#|--)\s*\[!code\s+(hl|focus):end\]\s*(?:\*\/|-->)?$/

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
      const lines = code.children.filter((i) => i.type === 'element') as Element[]
      const linesToRemove: (Element | Text)[] = []
      const activeBlocks: BlockState[] = []
      const lineAnnotations: Map<number, BlockType[]> = new Map()
      let hasFocus = false

      lines.forEach((line, idx) => {
        const lineText = getLineText(line)

        const startMatch = lineText.match(startRegex)
        if (startMatch) {
          const blockType = startMatch[1] as BlockType
          activeBlocks.push({ type: blockType, startIndex: idx })
          markLineForRemoval(line, code, linesToRemove)
          return
        }

        const endMatch = lineText.match(endRegex)
        if (endMatch) {
          const blockType = endMatch[1] as BlockType
          const blockIndex = activeBlocks.findIndex((b) => b.type === blockType)
          if (blockIndex !== -1) {
            activeBlocks.splice(blockIndex, 1)
          }
          markLineForRemoval(line, code, linesToRemove)
          return
        }

        for (const block of activeBlocks) {
          const annotations = lineAnnotations.get(idx) || []
          annotations.push(block.type)
          lineAnnotations.set(idx, annotations)
          if (block.type === 'focus') hasFocus = true
        }
      })

      for (const [idx, annotations] of lineAnnotations) {
        const line = lines[idx]
        if (!line) continue
        for (const annotation of annotations) {
          const className = annotation === 'hl' ? highlightClass : focusClass
          addClassToHast(line, className)
        }
      }

      if (hasFocus) {
        addClassToHast(this.pre, focusActivePreClass)
      }

      for (const node of linesToRemove) {
        const index = code.children.indexOf(node)
        if (index !== -1) {
          code.children.splice(index, 1)
        }
      }
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

function markLineForRemoval(line: Element, code: Element, linesToRemove: (Element | Text)[]): void {
  linesToRemove.push(line)
  const lineIndex = code.children.indexOf(line)
  const nextNode = code.children[lineIndex + 1]
  if (nextNode && nextNode.type === 'text' && nextNode.value === '\n') {
    linesToRemove.push(nextNode)
  }
}
