'use client'

import * as React from 'react'
import { useRouter } from 'waku'
import * as Path from '../internal/path.js'

/**
 * Returns the id of the in-page section currently being read, out of the
 * `#fragment` links that point at the current page. Sections without a link
 * (such as nested headings) count as part of the preceding linked section.
 *
 * @param links - Links to track, such as the `link` of every sidebar item. Links
 *   to other pages and links without a fragment are ignored.
 * @returns The id of the active section, or `null` above the first linked section.
 */
export function useActiveSidebarAnchor(links: readonly string[]): string | null {
  const { path, hash } = useRouter()
  const pagePath = path.split('#')[0] ?? path

  // Key on the serialized ids so a new `links` array with the same ids keeps tracking.
  const key = React.useMemo(() => JSON.stringify(ids(links, pagePath)), [links, pagePath])
  const anchorIds = React.useMemo(() => new Set<string>(JSON.parse(key)), [key])

  const [active, setActive] = React.useState<{ id: string | null; path: string }>({
    id: null,
    path: pagePath,
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-read positions when the hash changes
  React.useEffect(() => {
    const setId = (id: string | null) =>
      setActive((previous) =>
        previous.id === id && previous.path === pagePath ? previous : { id, path: pagePath },
      )
    if (anchorIds.size === 0) {
      setId(null)
      return
    }

    let anchors: { element: HTMLElement; margin: number }[] = []
    let stale = true
    let frame = 0

    const update = () => {
      frame = 0
      if (stale) {
        stale = false
        anchors = Array.from(
          document.querySelectorAll<HTMLElement>(
            'article[data-v-content] [id], [data-v-openapi] [id]',
          ),
        )
          // Changelog release bodies can repeat ids of linked sections.
          .filter((element) => anchorIds.has(element.id) && !element.closest('[data-v-changelog]'))
          .map((element) => ({
            element,
            margin: Number.parseFloat(getComputedStyle(element).scrollMarginTop) || 0,
          }))
      }

      // A section is active once its heading reaches the position the browser
      // scrolls anchors to, below the sticky mobile outline when it is shown.
      const padding =
        Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
      const outline = document.querySelector('[data-v-outline-mobile]')
      const outlineBottom = outline?.getClientRects().length
        ? outline.getBoundingClientRect().bottom
        : 0

      const visible = anchors.filter(({ element }) => element.getClientRects().length > 0)
      let id: string | null = null
      for (const { element, margin } of visible) {
        if (element.getBoundingClientRect().top > Math.max(padding + margin, outlineBottom) + 2)
          break
        id = element.id
      }

      // A short final section may never reach that position.
      const last = visible.at(-1)?.element
      const bottom = document.documentElement.scrollHeight - 2
      if (last && window.scrollY > 0 && window.scrollY + window.innerHeight >= bottom)
        if (last.getBoundingClientRect().top < window.innerHeight) id = last.id

      setId(id)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    const invalidate = () => {
      stale = true
      schedule()
    }
    update()

    // Read positions on scroll instead of relying on intersection order, so the
    // active section is right when scrolling up or jumping over several sections.
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', invalidate)
    window.addEventListener('hashchange', schedule)
    // Client navigation and async content (e.g. OpenAPI pages) can render the
    // headings after this effect runs.
    const mutation = new MutationObserver(invalidate)
    mutation.observe(document.body, { childList: true, subtree: true })
    const resize = new ResizeObserver(schedule)
    resize.observe(document.documentElement)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', invalidate)
      window.removeEventListener('hashchange', schedule)
      mutation.disconnect()
      resize.disconnect()
    }
  }, [anchorIds, pagePath, hash])

  // Ignore the previous page's section until the effect has run for this one.
  return active.path === pagePath ? active.id : null
}

/** Decoded `#fragment` ids of the links that point at `pagePath`. */
function ids(links: readonly string[], pagePath: string): string[] {
  const result = new Set<string>()
  for (const link of links) {
    if (Path.isExternal(link)) continue
    const index = link.indexOf('#')
    if (index === -1) continue
    const target = link.slice(0, index)
    const id = decode(link.slice(index + 1))
    if (id && (!target || Path.matches(pagePath, target))) result.add(id)
  }
  return [...result]
}

/** @internal */
export function decode(fragment: string) {
  try {
    return decodeURIComponent(fragment)
  } catch {
    return fragment
  }
}
