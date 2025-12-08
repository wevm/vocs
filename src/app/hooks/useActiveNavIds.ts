import { useMemo } from 'react'
import type { ParsedTopNavItem } from '../../config.js'

function getActiveNavIds({
  items,
  pathname,
}: {
  items: ParsedTopNavItem[]
  pathname: string
}): number[] {
  const path = pathname.replace(/\.html$/, '')
  const matches: { id: number; children: number[] }[] = []

  for (const item of items) {
    if (
      item.link &&
      (typeof item.match === 'function'
        ? item.match(path)
        : path.startsWith(item.match || item.link))
    )
      matches.push({ id: item.id, children: [] })
    else if (item.items) {
      const activeChildItems = getActiveNavIds({ items: item.items, pathname })
      if (activeChildItems.length > 0) matches.push({ id: item.id, children: activeChildItems })
    }
  }

  // Return only the last match and its children (prefer most specific/last match)
  if (matches.length === 0) return []
  const lastMatch = matches[matches.length - 1]
  return [lastMatch.id, ...lastMatch.children]
}

export function useActiveNavIds({
  items,
  pathname,
}: {
  items: ParsedTopNavItem[]
  pathname: string
}): number[] {
  return useMemo(() => getActiveNavIds({ items, pathname }), [items, pathname])
}
