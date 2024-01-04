import { twoslasher as twoslasher_ } from '@typescript/twoslash'
import * as cache from '../../utils/cache.js'
import { hash } from '../../utils/hash.js'

export function twoslasher(
  ...parameters: Parameters<typeof twoslasher_>
): ReturnType<typeof twoslasher_> {
  const codeHash = hash(parameters[0])
  if (cache.twoslash.get(codeHash)) return cache.twoslash.get(codeHash)
  try {
    const twoslash = twoslasher_(...parameters)
    cache.twoslash.set(codeHash, twoslash)
    return twoslash
  } catch (e) {
    const error = e as Error
    const lines = parameters[0].split('\n')
    const line = lines.length - 1
    return {
      code: parameters[0],
      errors: [
        {
          category: 1,
          code: 0,
          length: 1,
          start: 0,
          line,
          character: 0,
          renderedMessage: error.message.replace('\n', ''),
          id: '',
        },
      ],
      extension: '',
      highlights: [],
      playgroundURL: '',
      queries: [],
      staticQuickInfos: [],
      tags: [],
    }
  }
}
