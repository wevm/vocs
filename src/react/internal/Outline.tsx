'use client'

import { Popover } from '@base-ui/react/popover'
import { cx } from 'cva'
import * as React from 'react'
import { Link, useRouter } from 'waku'
import { style, theme } from 'zyzz/default'
import LucideArrowUp from '~icons/lucide/arrow-up'
import LucideChevronRight from '~icons/lucide/chevron-right'
import LucideTextAlignStart from '~icons/lucide/text-align-start'
import * as MdxPageContext from '../MdxPageContext.js'
import { useTopGutterOffset } from '../useTopGutterOffset.js'
import * as CopyForAi from './CopyForAi.client.js'
import * as Feedback from './Feedback.client.js'
import { getHeadingText } from './getHeadingText.js'

namespace styles {
  export const outline = style({
    position: 'sticky',
    zIndex: 10,
    maxHeight: 12,
    borderTopStyle: 'solid',
    borderTopWidth: '0px',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    paddingInline: 'var(--vocs-layout-content-px)',
    paddingBlock: 3,
    transitionProperty: 'top',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    '@media (width >= 64rem)': {
      borderTopLeftRadius: '1rem',
      borderTopStyle: 'solid',
      borderTopWidth: '1px',
      borderLeftStyle: 'solid',
      borderLeftWidth: '1px',
    },
    '@media (width >= 1376px)': { display: 'none' },
  })
  export const outline2 = style({
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    gap: 1,
    fontSize: '13px',
    fontWeight: 'medium',
  })
  export const outline3 = style({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: 1,
    WebkitUserSelect: 'none',
    userSelect: 'none',
  })
  export const outline4 = style({ width: 'calc(0.25rem * 3.5)', height: 'calc(0.25rem * 3.5)' })
  export const outline5 = style({
    width: 'calc(0.25rem * 3.5)',
    height: 'calc(0.25rem * 3.5)',
    translate: '0 1px',
    color: `color-mix(in oklab, ${theme.vars.color.gray['900']} 80%, transparent)`,
    transitionProperty: 'transform, translate, scale, rotate',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '200ms',
    selectors: { '&[data-popup-open]': { rotate: '90deg' } },
  })
  export const outline6 = style({
    position: 'relative',
    zIndex: 50,
    maxHeight: '60vh',
    width: 'calc(100vw - var(--vocs-layout-gutter) - 2 * var(--vocs-layout-content-px))',
    maxWidth: '70ch',
    transformOrigin: 'var(--transform-origin)',
    scale: '100% 100%',
    overflowY: 'auto',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.background['200'],
    padding: 3,
    opacity: '100%',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    transitionProperty: 'all',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&[data-ending-style]': {
        scale: '95% 95%',
        opacity: '0%',
        borderStyle: 'solid',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '&[data-starting-style]': {
        scale: '95% 95%',
        opacity: '0%',
        borderStyle: 'solid',
        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
    '@media (width >= 1376px)': { display: 'none' },
  })
  export const outline7 = style({
    marginLeft: 'auto',
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: 1,
    color: `color-mix(in oklab, ${theme.vars.color.gray['900']} 80%, transparent)`,
    WebkitUserSelect: 'none',
    userSelect: 'none',
    selectors: { '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } } },
  })
  export const outline8 = style({ width: 'calc(0.25rem * 3.5)', height: 'calc(0.25rem * 3.5)' })
  export const outline9 = style({
    position: 'fixed',
    right: 0,
    zIndex: 10,
    scrollbarWidth: 'none',
    selectors: { '&::-webkit-scrollbar': { display: 'none' } },
    display: 'flex',
    width: 'var(--vocs-layout-gutter)',
    flexDirection: 'column',
    overflowX: 'clip',
    overflowY: 'auto',
    paddingBlock: 'var(--vocs-layout-content-py)',
    paddingRight: 8,
    paddingLeft: 1,
    '@media (width < 1376px)': { display: 'none' },
  })
  export const outline10 = style({
    display: 'flex',
    flexShrink: 0,
    flexDirection: 'column',
    gap: 3,
    fontSize: '13px',
  })
  export const outline11 = style({
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: 1,
    fontSize: '13px',
    fontWeight: 'medium',
  })
  export const outline12 = style({ width: 'calc(0.25rem * 3.5)', height: 'calc(0.25rem * 3.5)' })
  export const outline13 = style({
    marginTop: 6,
    maxWidth: 'calc(0.25rem * 68.5)',
  })
  export const outline14 = style({
    marginTop: 6,
    maxWidth: 'calc(0.25rem * 68.5)',
  })
  export const outline15 = style({ marginTop: 6 })
  export const items = style({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    borderColor: theme.vars.color.gray['400'],
    fontSize: '13px',
    '@media (width >= 1376px)': { borderLeftStyle: 'solid', borderLeftWidth: '2px' },
  })
  export const items2 = style({
    position: 'absolute',
    left: '-2px',
    width: 'calc(0.25rem * 0.5)',
    borderRadius: 'calc(infinity * 1px)',
    backgroundColor: theme.vars.color.blue['700'],
    transitionProperty: 'transform,height',
    transitionTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
    transitionDuration: '150ms',
    willChange: 'transform',
    '@media (width < 1376px)': { display: 'none' },
  })
  export const element = style({ scrollMarginBlock: 'calc(0.25rem * 4)' })
  export const element2 = style({
    lineHeight: 1.375,
    display: 'block',
    cursor: 'pointer',
    paddingBlock: 'calc(0.25rem * 0.75)',
    paddingLeft: 3,
    fontWeight: 'medium',
    color: theme.vars.color.gray['900'],
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '100ms',
    selectors: {
      '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } },
      '&[data-active="true"]': { color: theme.vars.color.blue['900'] },
    },
  })
}

function useOutlineItems(options: { minLevel: number; maxLevel: number }) {
  const { minLevel, maxLevel } = options
  const router = useRouter()
  const [items, setItems] = React.useState<Outline.Item[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: path triggers re-scan on route change
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const scanHeadings = () => {
      const headingElements = Array.from(
        document.querySelectorAll('article[data-v-content] :is(h2, h3, h4, h5, h6)[id]'),
        // Changelog release bodies render as nested `[data-v-content]` inside the
        // main article; their headings have their own `Versions` outline, so keep
        // them out of the page outline (otherwise they flood/leak into it).
      ).filter((element) => !element.closest('[data-v-changelog]'))
      const newItems = headingElements
        .map((element) => {
          const level = Number.parseInt(element.tagName[1] ?? '0', 10)
          if (level < minLevel || level > maxLevel) return null

          const id = element.id
          const text = getHeadingText(element)
          const topOffset = window.scrollY + element.getBoundingClientRect().top

          return { id, level, text, topOffset }
        })
        .filter(Boolean) as Outline.Item[]

      setItems((prev) => {
        const prevIds = prev.map((i) => i.id).join(',')
        const newIds = newItems.map((i) => i.id).join(',')
        if (prevIds === newIds) return prev
        return newItems
      })
    }

    scanHeadings()

    if (window.location.hash) setActiveId(window.location.hash.slice(1))
    else {
      setItems((current) => {
        const first = current[0]
        if (first) setActiveId(first.id)
        return current
      })
    }

    const article = document.querySelector('article[data-v-content]')
    if (!article) return

    const observer = new MutationObserver(scanHeadings)
    observer.observe(article, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [router.path, minLevel, maxLevel])

  React.useEffect(() => {
    if (typeof window === 'undefined') return
    if (items.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
      },
      { rootMargin: '0px 0px -80% 0px' },
    )

    for (const item of items) {
      const element = document.getElementById(item.id)
      if (element) observer.observe(element)
    }

    return () => observer.disconnect()
  }, [items])

  React.useEffect(() => {
    if (typeof window === 'undefined' || items.length === 0) return

    const handleScroll = () => {
      const first = items[0]
      if (window.scrollY === 0 && first) {
        setActiveId(first.id)
        return
      }

      const scrollBottom = window.scrollY + window.innerHeight
      const docHeight = document.documentElement.scrollHeight

      const last = items[items.length - 1]
      if (scrollBottom >= docHeight - 10 && last) {
        setActiveId(last.id)
        return
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [items])

  return { items, activeId }
}

export function Outline(props: Outline.Props) {
  const { className, minLevel = 2, maxLevel: maxLevelProp = 3, footer: Footer } = props

  const { frontmatter } = MdxPageContext.use()
  const { outline = true } = frontmatter ?? {}
  const maxLevel = typeof outline === 'number' ? outline + 1 : maxLevelProp
  const enabled = outline !== false

  const { items, activeId } = useOutlineItems({ minLevel, maxLevel })

  const [showReturnToTop, setShowReturnToTop] = React.useState(false)
  const [popoverOpen, setPopoverOpen] = React.useState(false)
  const topOffset = useTopGutterOffset()

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const handleScroll = () => {
      setShowReturnToTop(window.scrollY > 100)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!enabled || items.length === 0) return null

  return (
    <>
      {/* Mobile: popover in flow */}
      <div
        className={cx(styles.outline().className, className)}
        style={{
          top: `calc(var(--vocs-layout-topNav) + var(--vocs-layout-banner) - ${topOffset}px)`,
        }}
        data-v-outline
        data-v-outline-mobile
      >
        <div {...styles.outline2()}>
          <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
            <Popover.Trigger className={styles.outline3().className}>
              <LucideTextAlignStart className={styles.outline4().className} />
              On this page
              <LucideChevronRight className={styles.outline5().className} />
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner
                side="bottom"
                align="start"
                sideOffset={8}
                collisionAvoidance={{ side: 'none' }}
                style={{ zIndex: 50 }}
              >
                <Popover.Popup className={styles.outline6().className} data-v-outline-popup>
                  <Items
                    items={items}
                    activeId={activeId}
                    minLevel={minLevel}
                    onSelect={() => setPopoverOpen(false)}
                  />
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>

          {showReturnToTop && (
            <button
              type="button"
              {...styles.outline7()}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <LucideArrowUp className={styles.outline8().className} />
              Return to top
            </button>
          )}
        </div>
      </div>

      {/* Desktop: fixed sidebar */}
      <div
        className={cx(styles.outline9().className, className)}
        style={{
          top: 'calc(var(--vocs-layout-topNav) + var(--vocs-layout-banner))',
          maxHeight: 'calc(100vh - var(--vocs-layout-topNav) - var(--vocs-layout-banner))',
        }}
        data-v-outline
        data-v-gutter-right
      >
        <nav {...styles.outline10()} data-v-outline-nav>
          <div {...styles.outline11()}>
            <LucideTextAlignStart className={styles.outline12().className} />
            On this page
          </div>

          <Items items={items} activeId={activeId} minLevel={minLevel} />
        </nav>

        <CopyForAi.CopyForAi className={styles.outline13().className} frontmatter={frontmatter} />

        <Feedback.Feedback className={styles.outline14().className} frontmatter={frontmatter} />

        {Footer && (
          <div {...styles.outline15()} data-v-outline-footer>
            <Footer />
          </div>
        )}
      </div>
    </>
  )
}

export declare namespace Outline {
  export type Props = {
    className?: string | undefined
    footer?: React.ComponentType | undefined
    minLevel?: number | undefined
    maxLevel?: number | undefined
  }

  export type Item = {
    id: string
    level: number
    text: string
    topOffset: number
  }
}

// biome-ignore lint/correctness/noUnusedVariables: _
function Items(props: Items.Props) {
  const { items, activeId, minLevel, onSelect } = props

  const containerRef = React.useRef<HTMLUListElement>(null)
  const [positions, setPositions] = React.useState<Map<string, { top: number; height: number }>>(
    new Map(),
  )

  const topLevelItems = React.useMemo(
    () => items.filter((item: Outline.Item) => item.level === minLevel),
    [items, minLevel],
  )

  const childrenMap = React.useMemo(() => {
    const map = new Map<string, Outline.Item[]>()
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (!item) continue
      const nextLevel = item.level + 1
      const children: Outline.Item[] = []

      for (let j = i + 1; j < items.length; j++) {
        const nextItem = items[j]
        if (!nextItem) break
        if (nextItem.level <= item.level) break
        if (nextItem.level === nextLevel) children.push(nextItem)
      }

      map.set(item.id, children)
    }
    return map
  }, [items])

  const activeIds = React.useMemo(() => {
    if (!activeId) return new Set<string>()

    const active = new Set<string>()

    const hasActiveDescendant = (item: Outline.Item) => {
      const children = childrenMap.get(item.id) ?? []
      for (const child of children)
        if (child.id === activeId || hasActiveDescendant(child)) return true
      return false
    }

    for (const item of items) {
      if (item.id === activeId || hasActiveDescendant(item)) {
        active.add(item.id)
      }
    }

    return active
  }, [activeId, items, childrenMap])

  React.useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return

    const measurePositions = () => {
      const positions = new Map<string, { top: number; height: number }>()
      const listItems = container.querySelectorAll<HTMLLIElement>('[data-v-outline-item]')

      for (const el of listItems) {
        const id = el.dataset['itemId']
        if (id)
          positions.set(id, {
            top: el.offsetTop,
            height: el.offsetHeight,
          })
      }

      setPositions(positions)
    }

    measurePositions()

    const observer = new ResizeObserver(measurePositions)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const indicatorStyle = React.useMemo<React.CSSProperties>(() => {
    if (activeIds.size === 0 || positions.size === 0)
      return { transform: 'translateY(0)', height: 0 }

    const activeItems = items.filter((item) => activeIds.has(item.id))
    if (activeItems.length === 0) return { transform: 'translateY(0)', height: 0 }

    const firstActive = activeItems[0]
    const lastActive = activeItems[activeItems.length - 1]
    if (!firstActive || !lastActive) return { transform: 'translateY(0)', height: 0 }

    const firstPos = positions.get(firstActive.id)
    const lastPos = positions.get(lastActive.id)
    if (!firstPos || !lastPos) return { transform: 'translateY(0)', height: 0 }

    return {
      transform: `translateY(${firstPos.top}px)`,
      height: lastPos.top + lastPos.height - firstPos.top,
    }
  }, [activeIds, positions, items])

  // Scroll the active item into view in the outline with margin
  React.useEffect(() => {
    if (!activeId || !containerRef.current) return

    const activeItem = containerRef.current.querySelector<HTMLElement>(
      `[data-item-id="${activeId}"]`,
    )
    if (!activeItem) return

    // Find the scrollable ancestor (the one with overflow-y: auto)
    let container: HTMLElement | null = containerRef.current.parentElement
    while (container && getComputedStyle(container).overflowY !== 'auto') {
      container = container.parentElement
    }
    if (!container) return

    const margin = 64
    const itemRect = activeItem.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    if (itemRect.bottom > containerRect.bottom - margin)
      container.scrollBy({
        top: itemRect.bottom - containerRect.bottom + margin,
        behavior: 'smooth',
      })
    else if (itemRect.top < containerRect.top + margin)
      container.scrollBy({
        top: itemRect.top - containerRect.top - margin,
        behavior: 'smooth',
      })
  }, [activeId])

  return (
    <ul ref={containerRef} {...styles.items()} data-v-outline-items>
      <div {...styles.items2()} style={indicatorStyle} data-v-outline-indicator />

      {topLevelItems.map((item) => (
        <OutlineItem
          key={item.id}
          item={item}
          depth={1}
          activeIds={activeIds}
          childrenMap={childrenMap}
          onSelect={onSelect}
        />
      ))}
    </ul>
  )
}

const OutlineItem = React.memo(function OutlineItem(props: {
  item: Outline.Item
  depth: number
  activeIds: Set<string>
  childrenMap: Map<string, Outline.Item[]>
  onSelect?: (() => void) | undefined
}) {
  const { item, depth, activeIds, childrenMap, onSelect } = props
  const isActive = activeIds.has(item.id)
  const children = childrenMap.get(item.id) ?? []
  const indent = (depth - 1) * 16

  return (
    <>
      <li data-v-outline-item data-item-id={item.id} data-active={isActive} {...styles.element()}>
        <Link
          to={`#${item.id}`}
          className={styles.element2().className}
          style={{ paddingLeft: `${indent + 12}px` }}
          data-active={isActive}
          onClick={onSelect}
        >
          {item.text}
        </Link>
      </li>

      {children.map((child) => (
        <OutlineItem
          key={child.id}
          item={child}
          depth={depth + 1}
          activeIds={activeIds}
          childrenMap={childrenMap}
          onSelect={onSelect}
        />
      ))}
    </>
  )
})

declare namespace Items {
  type Props = {
    items: Outline.Item[]
    activeId: string | null
    minLevel: number
    onSelect?: (() => void) | undefined
  }
}
