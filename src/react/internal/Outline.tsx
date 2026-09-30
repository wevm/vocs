'use client'

import { Popover } from '@base-ui/react/popover'
import * as React from 'react'
import { Link, useRouter } from 'waku'
import LucideArrowUp from '~icons/lucide/arrow-up'
import LucideChevronRight from '~icons/lucide/chevron-right'
import LucideTextAlignStart from '~icons/lucide/text-align-start'
import { style, vars } from '../../styles/zyzz.config.js'
import * as MdxPageContext from '../MdxPageContext.js'
import { useTopGutterOffset } from '../useTopGutterOffset.js'
import * as CopyForAi from './CopyForAi.client.js'
import * as Feedback from './Feedback.client.js'
import { getHeadingText } from './getHeadingText.js'

namespace styles {
  export const mobileRoot = style({
    position: 'sticky',
    zIndex: 10,
    maxHeight: '12',
    borderTopStyle: 'solid',
    borderTopWidth: '0px',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    paddingInline: 'content-px',
    paddingBlock: '3',
    transitionProperty: 'top',
    transitionTimingFunction: 'standard',
    transitionDuration: '150ms !custom',
    '@media (width >= 1080px)': {
      borderTopLeftRadius: '2xl',
      borderTopStyle: 'solid',
      borderTopWidth: '1px',
      borderLeftStyle: 'solid',
      borderLeftWidth: '1px',
    },
    '@media (width >= 1376px)': {
      display: 'none',
    },
  })

  export const mobileHeader = style({
    display: 'flex',
    width: '100% !custom',
    alignItems: 'center',
    gap: '1',
    fontSize: '13px !custom',
    fontWeight: 'medium',
  })

  export const trigger = style({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '1',
    WebkitUserSelect: 'none',
    userSelect: 'none',
  })

  export const triggerIcon = style({
    width: 'threeAndHalf',
    height: 'threeAndHalf',
  })

  export const chevronIcon = style({
    width: 'threeAndHalf',
    height: 'threeAndHalf',
    translate: '0 1px !custom',
    color: 'secondary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.secondary} 80%, transparent) !custom`,
    },
    transitionProperty: 'transform, translate, scale, rotate',
    transitionTimingFunction: 'standard',
    transitionDuration: '200ms !custom',
    selectors: {
      '&[data-popup-open]': {
        rotate: '90deg',
      },
    },
  })

  export const popup = style({
    position: 'relative',
    zIndex: 50,
    maxHeight: '60vh !custom',
    width: `calc(100vw - ${vars.spacing.gutter} - 2 * ${vars.spacing['content-px']}) !custom`,
    maxWidth: '70ch !custom',
    transformOrigin: 'var(--transform-origin)',
    scale: '100% 100%',
    overflowY: 'auto',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'primary',
    padding: '3',
    opacity: '100%',
    boxShadow:
      '0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    transitionProperty: 'all',
    transitionTimingFunction: 'standard',
    transitionDuration: '150ms !custom',
    '@media (width >= 1376px)': {
      display: 'none',
    },
    selectors: {
      '&[data-ending-style]': {
        scale: '95% 95%',
        opacity: '0%',
      },
      '&[data-starting-style]': {
        scale: '95% 95%',
        opacity: '0%',
      },
    },
  })

  export const scrollToTop = style({
    marginLeft: 'auto !custom',
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '1',
    color: 'secondary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.secondary} 80%, transparent) !custom`,
    },
    WebkitUserSelect: 'none',
    userSelect: 'none',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'heading',
        },
      },
    },
  })

  export const desktopRoot = style({
    position: 'fixed',
    right: '0',
    zIndex: 10,
    display: 'flex',
    width: 'gutter',
    scrollbarWidth: 'none',
    flexDirection: 'column',
    overflowX: 'clip',
    overflowY: 'auto',
    paddingBlock: 'content-py',
    paddingRight: '8',
    paddingLeft: '1',
    '@media (width < 1376px)': {
      display: 'none',
    },
    selectors: {
      '&::-webkit-scrollbar': {
        display: 'none',
      },
    },
  })

  export const navigation = style({
    display: 'flex',
    flexShrink: 0,
    flexDirection: 'column',
    gap: '3',
    fontSize: '13px !custom',
  })

  export const actions = style({
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: '1',
    fontSize: '13px !custom',
    fontWeight: 'medium',
  })

  export const action = style({
    marginTop: '6',
    maxWidth: 'outlineContent',
  })

  export const footer = style({
    marginTop: '6',
  })

  export const items = style({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    borderColor: 'primary',
    fontSize: '13px !custom',
    '@media (width >= 1376px)': {
      borderLeftStyle: 'solid',
      borderLeftWidth: '2px',
    },
  })

  export const indicator = style({
    position: 'absolute',
    left: '-2px !custom',
    width: 'half',
    borderRadius: 'calc(infinity * 1px) !custom',
    backgroundColor: 'accent',
    transitionProperty: 'transform,height',
    transitionTimingFunction: 'out',
    transitionDuration: '150ms !custom',
    willChange: 'transform',
    '@media (width < 1376px)': {
      display: 'none',
    },
  })

  export const item = style({
    scrollMarginBlock: '4',
  })

  export const link = style({
    display: 'block',
    cursor: 'pointer',
    paddingBlock: 'threeQuarters',
    paddingLeft: '3',
    fontWeight: '450 !custom',
    color: 'secondary',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: '100ms !custom',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'link',
        },
      },
      '&[data-active="true"]': {
        color: 'accent',
      },
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
        {...styles.mobileRoot({ className })}
        style={{
          top: `calc(var(--vocs-spacing-topNav) + var(--vocs-spacing-banner) - ${topOffset}px)`,
        }}
        data-v-outline
        data-v-outline-mobile
      >
        <div {...styles.mobileHeader()}>
          <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
            <Popover.Trigger {...styles.trigger()}>
              <LucideTextAlignStart {...styles.triggerIcon()} />
              On this page
              <LucideChevronRight {...styles.chevronIcon()} />
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner
                side="bottom"
                align="start"
                sideOffset={8}
                collisionAvoidance={{ side: 'none' }}
                style={{ zIndex: 50 }}
              >
                <Popover.Popup {...styles.popup()} data-v-outline-popup>
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
              {...styles.scrollToTop()}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <LucideArrowUp {...styles.triggerIcon()} />
              Return to top
            </button>
          )}
        </div>
      </div>

      {/* Desktop: fixed sidebar */}
      <div
        {...styles.desktopRoot({ className })}
        style={{
          top: 'calc(var(--vocs-spacing-topNav) + var(--vocs-spacing-banner))',
          maxHeight: 'calc(100vh - var(--vocs-spacing-topNav) - var(--vocs-spacing-banner))',
        }}
        data-v-outline
        data-v-gutter-right
      >
        <nav {...styles.navigation()} data-v-outline-nav>
          <div {...styles.actions()}>
            <LucideTextAlignStart {...styles.triggerIcon()} />
            On this page
          </div>

          <Items items={items} activeId={activeId} minLevel={minLevel} />
        </nav>

        <CopyForAi.CopyForAi {...styles.action()} frontmatter={frontmatter} />

        <Feedback.Feedback {...styles.action()} frontmatter={frontmatter} />

        {Footer && (
          <div {...styles.footer()} data-v-outline-footer>
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
      <div {...styles.indicator()} style={indicatorStyle} data-v-outline-indicator />

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
      <li data-v-outline-item data-item-id={item.id} data-active={isActive} {...styles.item()}>
        <Link
          to={`#${item.id}`}
          {...styles.link()}
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
