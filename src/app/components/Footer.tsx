import { Pencil2Icon } from '@radix-ui/react-icons'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import clsx from 'clsx'
import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Footer as ConsumerFooter } from 'virtual:consumer-components'

import type { SidebarItem } from '../../config.js'
import { useEditLink } from '../hooks/useEditLink.js'
import { useLayout } from '../hooks/useLayout.js'
import { useMounted } from '../hooks/useMounted.js'
import { usePageData } from '../hooks/usePageData.js'
import { useSidebar } from '../hooks/useSidebar.js'
import * as styles from './Footer.css.js'
import { sizeVar } from './Icon.css.js'
import { Icon } from './Icon.js'
import { KeyboardShortcut } from './KeyboardShortcut.js'
import { Link } from './Link.js'
import { ArrowLeft } from './icons/ArrowLeft.js'
import { ArrowRight } from './icons/ArrowRight.js'

export function Footer() {
  const { layout } = useLayout()
  const mounted = useMounted()
  const pageData = usePageData()

  const lastUpdatedAtDate = useMemo(
    () => (pageData.lastUpdatedAt ? new Date(pageData.lastUpdatedAt) : undefined),
    [pageData.lastUpdatedAt],
  )
  const lastUpdatedAtISOString = useMemo(
    () => lastUpdatedAtDate?.toISOString(),
    [lastUpdatedAtDate],
  )

  return (
    <footer className={styles.root}>
      {layout === 'docs' && (
        <>
          <div className={styles.container}>
            <EditLink />
            {mounted && pageData.lastUpdatedAt && (
              <div className={styles.lastUpdated}>
                Last updated:{' '}
                <time dateTime={lastUpdatedAtISOString}>
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(lastUpdatedAtDate)}
                </time>
              </div>
            )}
          </div>
          <Navigation />
        </>
      )}
      <ConsumerFooter />
    </footer>
  )
}

function EditLink() {
  const editLink = useEditLink()

  if (!editLink.url) return null
  return (
    <div>
      <Link className={styles.editLink} href={editLink.url}>
        <Pencil2Icon /> {editLink.text}
      </Link>
    </div>
  )
}

function Navigation() {
  const mounted = useMounted()
  const sidebar = useSidebar()

  const { pathname } = useLocation()
  const flattenedSidebar = useMemo(
    () => flattenSidebar(sidebar.items || []).filter((item) => item.link),
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

  if (!mounted) return null
  return (
    <div className={styles.navigation}>
      {prevPage ? (
        <Link
          className={clsx(styles.navigationItem, styles.navigationItem_left)}
          href={prevPage.link}
          variant="styleless"
        >
          <div className={styles.navigationText}>
            <div
              className={clsx(styles.navigationIcon, styles.navigationIcon_left)}
              style={assignInlineVars({ [sizeVar]: '0.75em' })}
            >
              <Icon label="Previous" icon={ArrowLeft} />
            </div>
            <div className={styles.navigationTextInner}>{prevPage.text}</div>
          </div>
          {/* TODO: Place in hover card */}
          <KeyboardShortcut description="Previous" keys={['shift', '←']} />
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
            <div className={styles.navigationTextInner} style={{ textAlign: 'right' }}>
              {nextPage.text}
            </div>
            <div
              className={clsx(styles.navigationIcon, styles.navigationIcon_right)}
              style={assignInlineVars({ [sizeVar]: '0.75em' })}
            >
              <Icon label="Next" icon={ArrowRight} />
            </div>
          </div>
          {/* TODO: Place in hover card */}
          <KeyboardShortcut description="Next" keys={['shift', '→']} />
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
