import { Fragment, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import * as styles from './Outline.css.js'
import { root as Heading, slugTarget } from './mdx/Heading.css.js'

type OutlineItems = {
  id: string
  level: number
  slugTargetElement: Element
  text: string | null
}[]

export function Outline({
  minLevel = 2,
  maxLevel = 3,
}: { minLevel?: number; maxLevel?: number } = {}) {
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

        const id = slugTargetElement.id
        const level = Number(element.tagName[1])
        const text = element.textContent

        if (level < minLevel || level > maxLevel) return null

        return {
          id,
          level,
          slugTargetElement,
          text,
        }
      })
      .filter(Boolean) as OutlineItems
  }, [headingElements, maxLevel, minLevel])

  const [activeId, setActiveId] = useState<string | null>(hash.replace('#', ''))
  useEffect(() => {
    if (typeof window === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
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

  if (items.length === 0) return null

  const levelItems = items.filter((item) => item.level === minLevel)
  return (
    <aside className={styles.root}>
      <nav className={styles.nav}>
        <h2 className={styles.heading}>On this page</h2>
        <Items
          activeId={activeId}
          items={items}
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
  setActiveId,
}: {
  activeId: string | null
  items: OutlineItems
  levelItems: OutlineItems
  setActiveId: (id: string) => void
}) {
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
                href={hash}
                onClick={() => setActiveId(id)}
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
                setActiveId={setActiveId}
              />
            )}
          </Fragment>
        )
      })}
    </ul>
  )
}
