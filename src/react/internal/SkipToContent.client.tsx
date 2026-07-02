'use client'

import { cx } from 'cva'
import { useRouter } from 'waku'

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
        'vocs:fixed vocs:top-3 vocs:left-3 vocs:z-50',
        'vocs:px-4 vocs:py-2',
        'vocs:text-accent8 vocs:text-sm vocs:font-medium',
        'vocs:bg-surface vocs:border-2 vocs:border-dashed vocs:border-accent8 vocs:rounded-lg',
        'vocs:outline-none',
        'vocs:opacity-0 vocs:pointer-events-none vocs:-translate-y-full',
        'vocs:focus:opacity-100 vocs:focus:pointer-events-auto vocs:focus:translate-y-0',
        'vocs:transition-all vocs:duration-150',
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
