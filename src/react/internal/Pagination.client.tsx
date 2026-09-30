'use client'

import * as React from 'react'
import { useRouter } from 'waku'
import LucideArrowLeft from '~icons/lucide/arrow-left'
import LucideArrowRight from '~icons/lucide/arrow-right'
import * as Sidebar from '../../internal/sidebar.js'
import { style } from '../../styles/zyzz.config.js'
import { Link } from '../Link.js'
import { useSidebar } from '../useSidebar.js'

namespace styles {
  export const root = style({
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '4',
    '@media (width < 40rem)': {
      flexDirection: 'column',
    },
  })

  export const previousLink = style({
    display: 'flex',
    flexDirection: 'column',
    gap: 'oneAndHalf',
    '@media (width < 40rem)': {
      width: '100% !custom',
      borderRadius: 'lg',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: 'primary',
      padding: '3',
    },
  })

  export const linkHeading = style({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    fontSize: 'lg',
    lineHeight: 'lg',
    fontWeight: 'medium',
    color: 'heading',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: 'standard',
    selectors: {
      '&:is(:where(.vocs\\:group):hover *)': {
        '@media (hover: hover)': {
          color: 'accent8',
        },
      },
    },
  })

  export const arrowIcon = style({
    width: '4',
    height: '4',
  })

  export const label = style({
    display: 'flex',
    alignItems: 'center',
    gap: 'oneAndHalf',
    fontSize: 'xs',
    lineHeight: 'xs',
    color: 'secondary',
  })

  export const nextLabel = style({
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    '@media (width < 40rem)': {
      display: 'none',
    },
  })

  export const nextLink = style({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 'oneAndHalf',
    '@media (width < 40rem)': {
      width: '100% !custom',
      borderRadius: 'lg',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: 'primary',
      padding: '3',
    },
  })

  export const shortcut = style({
    borderRadius: '0.25rem !custom',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    paddingInline: 'oneAndHalf',
    paddingBlock: 'half',
    fontFamily: 'mono',
    fontSize: 'xs',
    lineHeight: 'xs',
    color: 'secondary',
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
    <nav aria-label="Pagination" {...styles.root({ className })} data-v-pagination>
      {prev?.link ? (
        <Link {...styles.previousLink({ className: 'vocs:group' })} to={prev.link}>
          <span {...styles.linkHeading()}>
            <LucideArrowLeft {...styles.arrowIcon()} />
            {prev.text}
          </span>
          <span {...styles.label()}>
            Previous
            <span {...styles.nextLabel()}>
              <Kbd>Shift</Kbd>
              <Kbd>←</Kbd>
            </span>
          </span>
        </Link>
      ) : (
        <div />
      )}

      {next?.link ? (
        <Link {...styles.nextLink({ className: 'vocs:group' })} to={next.link}>
          <span {...styles.linkHeading()}>
            {next.text}
            <LucideArrowRight {...styles.arrowIcon()} />
          </span>
          <span {...styles.label()}>
            Next
            <span {...styles.nextLabel()}>
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
  return <kbd {...styles.shortcut()}>{children}</kbd>
}

declare namespace Kbd {
  type Props = {
    children: React.ReactNode
  }
}
