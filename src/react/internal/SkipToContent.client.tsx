'use client'

import { cx } from 'cva'
import { useRouter } from 'waku'
import { style, theme } from 'zyzz/default'

namespace styles {
  export const skipToContent = style({
    position: 'fixed',
    top: 3,
    left: 3,
    zIndex: 50,
  })
  export const skipToContent2 = style({
    paddingInline: 4,
    paddingBlock: 2,
  })
  export const skipToContent3 = style({
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    fontWeight: 'medium',
    color: theme.vars.color.blue['800'],
  })
  export const skipToContent4 = style({
    borderRadius: 'lg',
    borderStyle: 'dashed',
    borderWidth: '2px',
    borderColor: theme.vars.color.blue['800'],
    backgroundColor: theme.vars.color.surface,
  })
  export const skipToContent5 = style({ outlineStyle: 'none' })
  export const skipToContent6 = style({
    pointerEvents: 'none',
    translate: '0 -100%',
    opacity: '0%',
  })
  export const skipToContent7 = style({
    selectors: {
      '&:focus': { pointerEvents: 'auto', translate: '0 calc(0.25rem * 0)', opacity: '100%' },
    },
  })
  export const skipToContent8 = style({
    transitionProperty: 'all',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
  })
}

export function SkipToContent(props: SkipToContent.Props) {
  const { className } = props
  const { path } = useRouter()

  return (
    // Native anchor (not the router `Link`) so fragment navigation moves the
    // browser's sequential-focus point into the content — the whole point of
    // a skip link. The href carries the page path because a hash-only href
    // would resolve against the `<base>` tag and navigate to the site root.
    <a
      className={cx(
        styles.skipToContent().className,
        styles.skipToContent2().className,
        styles.skipToContent3().className,
        styles.skipToContent4().className,
        styles.skipToContent5().className,
        styles.skipToContent6().className,
        styles.skipToContent7().className,
        styles.skipToContent8().className,
        className,
      )}
      data-v-skip-to-content
      href={`${path.split('#')[0]}#vocs-content`}
    >
      Skip to content
    </a>
  )
}

export declare namespace SkipToContent {
  export type Props = {
    className?: string | undefined
  }
}
