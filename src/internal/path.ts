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

export function isExternal(url: string | undefined) {
  if (!url) return false
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('//') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:')
  )
}

/**
 * Normalize a base path into a prefix that can be concatenated with a
 * root-absolute path. The root base path (`/`) yields an empty string.
 *
 * @param basePath - The configured base path (e.g. `/docs`, `/docs/`, `/`).
 * @returns The prefix (e.g. `/docs`), or an empty string when there is none.
 */
export function basePathPrefix(basePath: string | undefined) {
  if (!basePath || basePath === '/') return ''
  return basePath.endsWith('/') ? basePath.slice(0, -1) : basePath
}

/**
 * Prefix a root-absolute path with the configured base path.
 *
 * @param pathname - The root-absolute path (e.g. `/api/feedback`).
 * @param basePath - The configured base path (e.g. `/docs`).
 * @returns The prefixed path (e.g. `/docs/api/feedback`).
 */
export function withBasePath(pathname: string, basePath: string | undefined) {
  return `${basePathPrefix(basePath)}${pathname}`
}

/**
 * Prefix a configured asset URL (e.g. `logoUrl`, `iconUrl`) with the base path.
 *
 * Only root-absolute URLs (`/logo.svg`) are prefixed. External, protocol-relative,
 * relative and `data:` URLs, and URLs that already start with the base path, are
 * returned as-is.
 *
 * @param url - The asset URL (e.g. `/logo.svg`).
 * @param basePath - The configured base path (e.g. `/docs`).
 * @returns The asset URL under the base path (e.g. `/docs/logo.svg`).
 */
export function withBasePathAsset(url: string, basePath: string | undefined) {
  const prefix = basePathPrefix(basePath)
  if (!prefix) return url
  if (!url.startsWith('/') || url.startsWith('//')) return url
  if (url === prefix || url.startsWith(`${prefix}/`)) return url
  return `${prefix}${url}`
}
