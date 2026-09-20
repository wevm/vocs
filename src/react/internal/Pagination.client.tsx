'use client'

import { cx } from 'cva'
import * as React from 'react'
import { useRouter } from 'waku'
import { style, theme } from 'zyzz/default'
import LucideArrowLeft from '~icons/lucide/arrow-left'
import LucideArrowRight from '~icons/lucide/arrow-right'
import * as Sidebar from '../../internal/sidebar.js'
import { Link } from '../Link.js'
import { useSidebar } from '../useSidebar.js'

namespace styles {
  export const pagination = style({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 4,
    '@media (width < 40rem)': { flexDirection: 'column' },
  })
  export const pagination2 = style({
    display: 'flex',
    flexDirection: 'column',
    gap: 'calc(0.25rem * 1.5)',
    '@media (width < 40rem)': {
      width: '100%',
      borderRadius: 'lg',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: theme.vars.color.gray['400'],
      padding: 3,
    },
  })
  export const pagination3 = style({
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    fontSize: 'lg',
    lineHeight: 'calc(1.75 / 1.125)',
    fontWeight: 'medium',
    color: theme.vars.color.foreground,
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:is(:where(.vocs-group):hover *)': {
        '@media (hover: hover)': { color: theme.vars.color.blue['800'] },
      },
    },
  })
  export const pagination4 = style({ width: 4, height: 4 })
  export const pagination5 = style({
    display: 'flex',
    alignItems: 'center',
    gap: 'calc(0.25rem * 1.5)',
    fontSize: 'xs',
    lineHeight: 'calc(1 / 0.75)',
    color: theme.vars.color.gray['900'],
  })
  export const pagination6 = style({
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    '@media (width < 40rem)': { display: 'none' },
  })
  export const pagination7 = style({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 'calc(0.25rem * 1.5)',
    '@media (width < 40rem)': {
      width: '100%',
      borderRadius: 'lg',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: theme.vars.color.gray['400'],
      padding: 3,
    },
  })
  export const pagination8 = style({
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    fontSize: 'lg',
    lineHeight: 'calc(1.75 / 1.125)',
    fontWeight: 'medium',
    color: theme.vars.color.foreground,
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:is(:where(.vocs-group):hover *)': {
        '@media (hover: hover)': { color: theme.vars.color.blue['800'] },
      },
    },
  })
  export const pagination9 = style({ width: 4, height: 4 })
  export const pagination10 = style({
    display: 'flex',
    alignItems: 'center',
    gap: 'calc(0.25rem * 1.5)',
    fontSize: 'xs',
    lineHeight: 'calc(1 / 0.75)',
    color: theme.vars.color.gray['900'],
  })
  export const pagination11 = style({
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    '@media (width < 40rem)': { display: 'none' },
  })
  export const kbd = style({
    borderRadius: 'sm',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    paddingInline: 'calc(0.25rem * 1.5)',
    paddingBlock: 'calc(0.25rem * 0.5)',
    fontFamily: theme.vars.fontFamily.mono,
    fontSize: 'xs',
    lineHeight: 'calc(1 / 0.75)',
    color: theme.vars.color.gray['900'],
  })
}

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
      className={cx(styles.pagination().className, className)}
      data-v-pagination
    >
      {prev?.link ? (
        <Link className={styles.pagination2({ className: 'vocs-group' }).className} to={prev.link}>
          <span {...styles.pagination3()}>
            <LucideArrowLeft className={styles.pagination4().className} />
            {prev.text}
          </span>
          <span {...styles.pagination5()}>
            Previous
            <span {...styles.pagination6()}>
              <Kbd>Shift</Kbd>
              <Kbd>←</Kbd>
            </span>
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next?.link ? (
        <Link className={styles.pagination7({ className: 'vocs-group' }).className} to={next.link}>
          <span {...styles.pagination8()}>
            {next.text}
            <LucideArrowRight className={styles.pagination9().className} />
          </span>
          <span {...styles.pagination10()}>
            Next
            <span {...styles.pagination11()}>
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
  return <kbd {...styles.kbd()}>{children}</kbd>
}

declare namespace Kbd {
  type Props = {
    children: React.ReactNode
  }
}
