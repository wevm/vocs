/**
 * Glob matching for source paths without platform dependencies. Supports `**`, `*`, `?`, and
 * `{a,b}` alternatives over `/`-separated paths.
 * @module
 */

/** Returns a predicate that tests a path against any of the patterns. */
export function matcher(patterns: string | readonly string[]): (path: string) => boolean {
  const expressions = (typeof patterns === 'string' ? [patterns] : patterns).map(toRegExp)
  return (path) => expressions.some((expression) => expression.test(path))
}

function toRegExp(pattern: string): RegExp {
  let source = ''
  for (let index = 0; index < pattern.length; index++) {
    const character = pattern[index]!
    if (character === '*' && pattern[index + 1] === '*') {
      // `**/` matches zero or more directories. A trailing `**` matches the rest of the path.
      const slash = pattern[index + 2] === '/'
      source += slash ? '(?:.*/)?' : '.*'
      index += slash ? 2 : 1
    } else if (character === '*') source += '[^/]*'
    else if (character === '?') source += '[^/]'
    else if (character === '{') source += '(?:'
    else if (character === '}') source += ')'
    else if (character === ',' && source.includes('(?:')) source += '|'
    else source += character.replace(/[.+^$()|[\]\\]/g, '\\$&')
  }
  return new RegExp(`^${source}$`)
}
