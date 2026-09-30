'use client'

import { useRouter } from 'waku'
import { style, vars } from '../../styles/zyzz.config.js'

namespace styles {
  export const link = style({
    pointerEvents: 'none',
    position: 'fixed',
    top: '3',
    left: '3',
    zIndex: 50,
    translate: '0 -100% !custom',
    borderRadius: 'lg',
    borderStyle: 'dashed',
    borderWidth: '2px',
    borderColor: 'accent8',
    backgroundColor: 'surface',
    paddingInline: '4',
    paddingBlock: '2',
    fontSize: 'sm',
    lineHeight: 'sm',
    fontWeight: 'medium',
    color: 'accent8',
    opacity: '0%',
    transitionProperty: 'all',
    transitionTimingFunction: 'standard',
    transitionDuration: '150ms !custom',
    outlineStyle: 'none',
    selectors: {
      '&:focus': {
        pointerEvents: 'auto',
        translate: `0 calc(${vars.spacing.unit} * 0) !custom`,
        opacity: '100%',
      },
    },
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
      {...styles.link({ className })}
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
