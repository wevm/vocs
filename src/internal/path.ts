type CompiledPathParam = { paramName: string; isOptional?: boolean }

/**
 * Compile a path pattern into a regular expression and extracted parameter metadata.
 *
 * @param path - The path pattern to compile (e.g., `/users/:id`, `/files/*`).
 * @param caseSensitive - Whether matching should be case-sensitive.
 * @param end - Whether the pattern should match to the end of the pathname.
 * @returns A tuple of the compiled RegExp and an array of parameter metadata.
 */
export function compile(
  path: string,
  caseSensitive = false,
  end = true,
): [RegExp, CompiledPathParam[]] {
  const params: CompiledPathParam[] = []
  let regexpSource =
    '^' +
    path
      .replace(/\/*\*?$/, '')
      .replace(/^\/*/, '/')
      .replace(/[\\.*+^${}|()[\]]/g, '\\$&')
      .replace(/\/:([\w-]+)(\?)?/g, (_: string, paramName: string, isOptional) => {
        params.push({ paramName, isOptional: isOptional != null })
        return isOptional ? '/?([^\\/]+)?' : '/([^\\/]+)'
      })
      .replace(/\/([\w-]+)\?(\/|$)/g, '(/$1)?$2')

  if (path.endsWith('*')) {
    params.push({ paramName: '*' })
    regexpSource += path === '*' || path === '/*' ? '(.*)$' : '(?:\\/(.+)|\\/*)$'
  } else if (end) {
    regexpSource += '\\/*$'
  } else if (path !== '' && path !== '/') {
    regexpSource += '(?:(?=\\/|$))'
  }

  const matcher = new RegExp(regexpSource, caseSensitive ? undefined : 'i')

  return [matcher, params]
}

/**
 * Determine if a path matches a pathname.
 *
 * @param pathname - The pathname to match against.
 * @param target - The path to match against.
 * @returns Whether the path matches the pathname.
 */
export function matches(pathname: string, target: string | undefined) {
  if (typeof target !== 'string') return false
  const [matcher] = compile(target, false, true)
  return pathname.match(matcher)
}
