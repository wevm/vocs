import clsx from 'clsx'
import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { SidebarItem } from '../../config.js'
import { useEditLink } from '../hooks/useEditLink.js'
import { useLayout } from '../hooks/useLayout.js'
import { useSidebar } from '../hooks/useSidebar.js'
import * as styles from './Footer.css.js'
import { Icon } from './Icon.js'
import { Link } from './Link.js'
import { ArrowLeft } from './icons/ArrowLeft.js'
import { ArrowRight } from './icons/ArrowRight.js'

export function Footer() {
  const { layout } = useLayout()

  return (
    <footer className={styles.root}>
      {layout === 'docs' && (
        <>
          <EditLink />
          <Navigation />
        </>
      )}
    </footer>
  )
}

function EditLink() {
  const editLink = useEditLink()

  return (
    <div>
      <Link className={styles.editLink} href={editLink.url}>
        {editLink.text}
      </Link>
    </div>
  )
}

function Navigation() {
  const sidebar = useSidebar()

  const { pathname } = useLocation()
  const flattenedSidebar = useMemo(
    () => flattenSidebar(sidebar || []).filter((item) => item.link),
    [sidebar],
  )
  const currentPageIndex = useMemo(
    () => flattenedSidebar.findIndex((item) => item.link === pathname),
    [flattenedSidebar, pathname],
  )

  const [prevPage, nextPage] = useMemo(() => {
    if (currentPageIndex < 0) return []
    if (currentPageIndex === 0) return [null, flattenedSidebar[currentPageIndex + 1]]
    if (currentPageIndex === flattenedSidebar.length - 1)
      return [flattenedSidebar[currentPageIndex - 1], null]
    return [flattenedSidebar[currentPageIndex - 1], flattenedSidebar[currentPageIndex + 1]]
  }, [currentPageIndex, flattenedSidebar])

  const navigate = useNavigate()
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    let index = currentPageIndex
    let isListening = false
    const keydown = (event: KeyboardEvent) => {
      if (event.code === 'ShiftLeft') isListening = true
      if (isListening) {
        const nextPage = flattenedSidebar[index + 1]
        const prevPage = flattenedSidebar[index - 1]
        if (event.code === 'ArrowRight' && nextPage?.link) {
          navigate(nextPage.link)
          index++
        }
        if (event.code === 'ArrowLeft' && prevPage?.link) {
          navigate(prevPage.link)
          index--
        }
      }
    }
    const keyup = (event: KeyboardEvent) => {
      if (event.code === 'ShiftLeft') isListening = false
    }

    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    return () => {
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
    }
  }, [])

  return (
    <div className={styles.navigation}>
      {prevPage ? (
        <Link
          className={clsx(styles.navigationItem, styles.navigationItem_left)}
          href={prevPage.link}
          variant="styleless"
        >
          <div className={styles.navigationText}>
            <div className={clsx(styles.navigationIcon, styles.navigationIcon_left)}>
              <Icon label="Previous" icon={ArrowLeft} size="14px" />
            </div>
            {prevPage.text}
          </div>
          <kbd className={clsx(styles.navigationShortcut, styles.navigationShortcut_left)}>
            Shift ←
          </kbd>
        </Link>
      ) : (
        <div />
      )}
      {nextPage ? (
        <Link
          className={clsx(styles.navigationItem, styles.navigationItem_right)}
          href={nextPage.link}
          variant="styleless"
        >
          <div className={styles.navigationText}>
            {nextPage.text}
            <div className={clsx(styles.navigationIcon, styles.navigationIcon_right)}>
              <Icon label="Next" icon={ArrowRight} size="14px" />
            </div>
          </div>
          <kbd className={clsx(styles.navigationShortcut, styles.navigationShortcut_right)}>
            Shift →
          </kbd>
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
}

function flattenSidebar(sidebar: SidebarItem[]) {
  const items: SidebarItem[] = []

  for (const item of sidebar) {
    if (item.items) {
      items.push(...flattenSidebar(item.items))
      continue
    }

    items.push(item)
  }

  return items
}
