'use client'

import { cx } from 'cva'
import * as React from 'react'
import { useRouter } from 'waku'
import LucideArrowLeft from '~icons/lucide/arrow-left'
import LucideArrowRight from '~icons/lucide/arrow-right'
import * as Sidebar from '../../internal/sidebar.js'
import { Link } from '../Link.js'
import { useSidebar } from '../useSidebar.js'

export function Pagination(props: Pagination.Props) {
  const { className } = props

  const router = useRouter()
  const sidebar = useSidebar()

  const items = React.useMemo(() => Sidebar.flatten(sidebar.items), [sidebar.items])

  const currentIndex = React.useMemo(
    () => items.findIndex((item) => item.link === router.path),
    [items, router.path],
  )

  const prev = currentIndex > 0 ? items[currentIndex - 1] : null
  const next = currentIndex < items.length - 1 ? items[currentIndex + 1] : null

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.shiftKey && event.key === 'ArrowLeft' && prev?.link) router.push(prev.link)
      else if (event.shiftKey && event.key === 'ArrowRight' && next?.link) router.push(next.link)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prev, next, router])

  if (!prev && !next) return null

  return (
    <nav
      aria-label="Pagination"
      className={cx('vocs:flex vocs:justify-between vocs:items-start', className)}
      data-v-pagination
    >
      {prev?.link ? (
        <Link className="vocs:flex vocs:flex-col vocs:gap-1.5 vocs:group" to={prev.link}>
          <span className="vocs:flex vocs:items-center vocs:gap-2 vocs:text-heading vocs:text-lg vocs:font-medium vocs:group-hover:text-accent8 vocs:transition-colors">
            <LucideArrowLeft className="vocs:size-4" />
            {prev.text}
          </span>
          <span className="vocs:flex vocs:items-center vocs:gap-1.5 vocs:text-secondary vocs:text-xs">
            Previous
            <span className="vocs:flex vocs:items-center vocs:gap-1">
              <Kbd>Shift</Kbd>
              <Kbd>←</Kbd>
            </span>
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next?.link ? (
        <Link
          className="vocs:flex vocs:flex-col vocs:items-end vocs:gap-1.5 vocs:group"
          to={next.link}
        >
          <span className="vocs:flex vocs:items-center vocs:gap-2 vocs:text-heading vocs:text-lg vocs:font-medium vocs:group-hover:text-accent8 vocs:transition-colors">
            {next.text}
            <LucideArrowRight className="vocs:size-4" />
          </span>
          <span className="vocs:flex vocs:items-center vocs:gap-1.5 vocs:text-secondary vocs:text-xs">
            Next
            <span className="vocs:flex vocs:items-center vocs:gap-1">
              <Kbd>Shift</Kbd>
              <Kbd>→</Kbd>
            </span>
          </span>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}

export declare namespace Pagination {
  export type Props = {
    className?: string | undefined
  }
}

// biome-ignore lint/correctness/noUnusedVariables: _
function Kbd(props: Kbd.Props) {
  const { children } = props
  return (
    <kbd className="vocs:bg-surface vocs:border vocs:border-primary vocs:rounded vocs:px-1.5 vocs:py-0.5 vocs:text-xs vocs:font-mono vocs:text-secondary">
      {children}
    </kbd>
  )
}

declare namespace Kbd {
  type Props = {
    children: React.ReactNode
  }
}
