import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { useLayout } from '../hooks/useLayout.js'
import { debounce } from '../utils/debounce.js'
import * as styles from './Outline.css.js'
import { root as Heading, slugTarget } from './mdx/Heading.css.js'

type OutlineItems = {
  id: string
  level: number
  slugTargetElement: Element
  topOffset: number
  text: string | null
}[]

export function Outline({
  minLevel = 2,
  maxLevel: maxLevel_ = 3,
  highlightActive = true,
  onClickItem,
  showTitle = true,
}: {
  minLevel?: number
  maxLevel?: number
  highlightActive?: boolean
  onClickItem?: () => void
  showTitle?: boolean
} = {}) {
  const { showOutline } = useLayout()
  const maxLevel = (() => {
    if (typeof showOutline === 'number') return minLevel + showOutline - 1
    return maxLevel_
  })()

  const active = useRef(true)

  const { pathname, hash } = useLocation()

  const [headingElements, setHeadingElements] = useState<Element[]>([])
  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    if (typeof window === 'undefined') return
    const elements = Array.from(document.querySelectorAll(`.${Heading}`))
    setHeadingElements(elements)
  }, [pathname])

  const items = useMemo(() => {
    if (!headingElements) return []

    return headingElements
      .map((element) => {
        const slugTargetElement = element.querySelector(`.${slugTarget}`)
        if (!slugTargetElement) return null

        const box = slugTargetElement.getBoundingClientRect()

        const id = slugTargetElement.id
        const level = Number(element.tagName[1])
        const text = element.textContent
        const topOffset = window.scrollY + box.top

        if (level < minLevel || level > maxLevel) return null

        return {
          id,
          level,
          slugTargetElement,
          text,
          topOffset,
        }
      })
      .filter(Boolean) as OutlineItems
  }, [headingElements, maxLevel, minLevel])

  const [activeId, setActiveId] = useState<string | null>(hash.replace('#', ''))

  // As the user scrolls the page, we want to make the corresponding outline item active.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!active.current) return

        const id = entry.target.id

        if (entry.isIntersecting) setActiveId(id)
        else {
          const box = entry.target.getBoundingClientRect()
          const isVisible = box.top > 0
          if (!isVisible) return

          const activeIndex = items.findIndex((item) => item.id === activeId)
          const previousId = items[activeIndex - 1]?.id
          setActiveId(previousId)
        }
      },
      {
        rootMargin: '0px 0px -95% 0px',
      },
    )

    for (const item of items) observer.observe(item.slugTargetElement)

    return () => observer.disconnect()
  }, [activeId, items])

  // When the user hits the bottom of the page, we want to make the last outline item active.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const observer = new IntersectionObserver(([entry]) => {
      if (!active.current) return

      const lastItemId = items[items.length - 1]?.id

      if (entry.isIntersecting) setActiveId(lastItemId)
      else if (activeId === lastItemId) setActiveId(items[items.length - 2].id)
    })

    observer.observe(document.querySelector('[data-bottom-observer]')!)

    return () => observer.disconnect()
  }, [activeId, items])

  // Intersection observers are a bit unreliable for fast scrolling,
  // use scroll event listener to sync active item.
  useEffect(() => {
    if (typeof window === 'undefined') return

    const callback = debounce(() => {
      if (!active.current) return

      if (window.scrollY === 0) {
        setActiveId(items[0]?.id)
        return
      }

      if (
        window.scrollY + document.documentElement.clientHeight >=
        document.documentElement.scrollHeight
      ) {
        setActiveId(items[items.length - 1]?.id)
        return
      }

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (window.scrollY < item.topOffset) {
          setActiveId(items[i - 1]?.id)
          break
        }
      }
    }, 100)

    window.addEventListener('scroll', callback)
    return () => window.removeEventListener('scroll', callback)
  }, [items])

  if (items.length === 0) return null

  const levelItems = items.filter((item) => item.level === minLevel)
  return (
    <aside className={styles.root}>
      <nav className={styles.nav}>
        {showTitle && <h2 className={styles.heading}>On this page</h2>}
        <Items
          activeId={highlightActive ? activeId : null}
          items={items}
          onClickItem={() => {
            onClickItem?.()
            active.current = false
            setTimeout(() => {
              active.current = true
            }, 500)
          }}
          levelItems={levelItems}
          setActiveId={setActiveId}
        />
      </nav>
    </aside>
  )
}

function Items({
  activeId,
  items,
  levelItems,
  onClickItem,
  setActiveId,
}: {
  activeId: string | null
  items: OutlineItems
  levelItems: OutlineItems
  onClickItem?: () => void
  setActiveId: (id: string) => void
}) {
  const { pathname } = useLocation()

  return (
    <ul className={styles.items}>
      {levelItems.map(({ id, level, text }) => {
        const hash = `#${id}`
        const isActive = activeId === id

        const nextLevelItems = (() => {
          const itemIndex = items.findIndex((item) => item.id === id)
          const nextIndex = itemIndex + 1
          const nextItemLevel = items[nextIndex]?.level
          if (nextItemLevel <= level) return null

          const nextItems = []
          for (let i = nextIndex; i < items.length; i++) {
            const item = items[i]
            if (item.level !== nextItemLevel) break
            nextItems.push(item)
          }
          return nextItems
        })()

        return (
          <Fragment key={id}>
            <li className={styles.item}>
              {/* biome-ignore lint/a11y/useValidAnchor: */}
              <a
                data-active={isActive}
                href={`${pathname}${hash}`}
                onClick={() => {
                  onClickItem?.()
                  setActiveId(id)
                }}
                className={styles.link}
              >
                {text}
              </a>
            </li>
            {nextLevelItems && (
              <Items
                activeId={activeId}
                levelItems={nextLevelItems}
                items={items}
                onClickItem={onClickItem}
                setActiveId={setActiveId}
              />
            )}
          </Fragment>
        )
      })}
    </ul>
  )
}
