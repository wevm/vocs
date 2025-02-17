import type { ShikiTransformer } from 'shiki'
import { transformerNotationMap } from './utils.js'

export interface TransformerNotationHighlightOptions {
  /**
   * Class for highlighted lines
   */
  classActiveLine?: string
  /**
   * Class added to the root element when the code has highlighted lines
   */
  classActivePre?: string
}

/**
 * Allow using `[!code highlight]` notation in code to mark highlighted lines.
 */
export function transformerNotationHighlight(
  options: TransformerNotationHighlightOptions = {},
): ShikiTransformer {
  const { classActiveLine = 'highlighted', classActivePre = 'has-highlighted' } = options

  return transformerNotationMap(
    {
      classMap: {
        highlight: classActiveLine,
        hl: classActiveLine,
      },
      classActivePre,
    },
    '@shikijs/transformers:notation-highlight',
  )
}
