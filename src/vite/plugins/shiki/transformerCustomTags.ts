import type { Element, Text } from 'hast'
import type { ShikiTransformer } from 'shiki'

const tags = ['error', 'log', 'warn', 'annotate']

/**
 * Transformer that detects and renders custom comment tags in code blocks
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
export const transformerCustomTags = (): ShikiTransformer => {
  const tagPattern = new RegExp(`@(${tags.join('|')}):\\s*(.+)`)

  return {
    name: 'custom-tags',
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

        const [, tagType, message] = match
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

        const targetClasses = targetLine.properties?.class
        const existingClasses = Array.isArray(targetClasses)
          ? targetClasses.filter((x) => typeof x === 'string' && x && !x.startsWith('tag-'))
          : typeof targetClasses === 'string'
            ? targetClasses.split(' ').filter((x) => x && !x.startsWith('tag-'))
            : []
        const tagLine: Element = {
          type: 'element',
          tagName: 'span',
          properties: {
            class: [...existingClasses, 'line', 'tag-line', `tag-${tag.type}-line`],
          },
          children: [
            {
              type: 'text',
              value: tag.message,
            },
          ],
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

function getTextContent(element: Element): string {
  let text = ''
  for (const child of element.children) {
    if (child.type === 'text') text += child.value
    else if (child.type === 'element') text += getTextContent(child as Element)
  }
  return text
}
