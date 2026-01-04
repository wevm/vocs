import { matchPath } from 'react-router'

/**
 * Determine if a path matches a pathname.
 *
 * @param pathname - The pathname to match against.
 * @param target - The path to match against.
 * @returns Whether the path matches the pathname.
 */
export function matches(pathname: string, target: string | undefined) {
  if (typeof target !== 'string') return false
  return matchPath(pathname, target)
}
