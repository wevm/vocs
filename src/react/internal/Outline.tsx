'use client'

import { cx } from 'cva'
import * as React from 'react'
import { Link, useRouter } from 'waku'
import LucideTextAlignStart from '~icons/lucide/text-align-start'
import * as MdxPageContext from '../MdxPageContext.js'

export function Outline(props: Outline.Props) {
  const { className, minLevel = 2, maxLevel: maxLevelProp = 3 } = props

  const { frontmatter } = MdxPageContext.use()
  const { outline = true } = frontmatter ?? {}
  const maxLevel = typeof outline === 'number' ? outline + 1 : maxLevelProp
  const enabled = outline !== false

  const router = useRouter()
  const [items, setItems] = React.useState<Outline.Item[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: path triggers re-scan on route change
  React.useEffect(() => {
    if (typeof window === 'undefined') return

    const scanHeadings = () => {
      const headingElements = Array.from(
        document.querySelectorAll('article[data-v-content] :is(h2, h3, h4, h5, h6)[id]'),
      )
      const newItems = headingElements
        .map((element) => {
          const level = Number.parseInt(element.tagName[1] ?? '0', 10)
          if (level < minLevel || level > maxLevel) return null

          const id = element.id
          const text = element.textContent ?? ''
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

  if (!enabled || items.length === 0) return null

  return (
    <nav
      className={cx('vocs:flex vocs:flex-col vocs:text-[13px] vocs:gap-3', className)}
      data-v-outline
    >
      <div className="vocs:flex vocs:items-center vocs:gap-1 vocs:text-[13px] vocs:font-medium">
        <LucideTextAlignStart className="vocs:size-3.5" />
        On this page
      </div>

      <Items items={items} activeId={activeId} minLevel={minLevel} />
    </nav>
  )
}

export declare namespace Outline {
  export type Props = {
    className?: string | undefined
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
  const { items, activeId, minLevel } = props

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

  return (
    <ul
      ref={containerRef}
      className="vocs:relative vocs:flex vocs:flex-col vocs:border-l-2 vocs:border-primary"
      data-v-outline-items
    >
      <div
        className="vocs:absolute vocs:left-[-2px] vocs:w-0.5 vocs:rounded-full vocs:bg-accent vocs:transition-[transform,height] vocs:duration-150 vocs:ease-out vocs:will-change-transform"
        style={indicatorStyle}
        data-v-outline-indicator
      />

      {topLevelItems.map((item) => (
        <OutlineItem
          key={item.id}
          item={item}
          depth={1}
          activeIds={activeIds}
          childrenMap={childrenMap}
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
}) {
  const { item, depth, activeIds, childrenMap } = props
  const isActive = activeIds.has(item.id)
  const children = childrenMap.get(item.id) ?? []
  const indent = (depth - 1) * 12

  return (
    <>
      <li data-v-outline-item data-item-id={item.id} data-active={isActive}>
        <Link
          to={`#${item.id}`}
          className="vocs:block vocs:leading-snug vocs:py-0.75 vocs:pl-3 vocs:cursor-pointer vocs:font-[450] vocs:transition-colors vocs:duration-100 vocs:text-secondary vocs:data-[active=true]:text-accent vocs:hover:text-link"
          style={{ paddingLeft: `${indent + 12}px` }}
          data-active={isActive}
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
  }
}
