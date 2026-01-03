'use client'

import { Popover } from '@base-ui/react/popover'
import type * as React from 'react'
import { useCallback } from 'react'

export function TwoslashHover(props: TwoslashHover.Props) {
  const { className = '', children, trigger } = props

  const { ref } = TwoslashHover.useOverflowFade()

  const open = className?.includes('twoslash-query-persisted')

  return (
    <Popover.Root {...(open ? { open } : {})}>
      <Popover.Trigger data-v-twoslash-trigger openOnHover delay={0}>
        <span>{trigger}</span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          side="bottom"
          sideOffset={4}
          collisionAvoidance={{ side: 'none' }}
        >
          <Popover.Popup className={className} initialFocus={false}>
            <Popover.Arrow className="vocs:data-[side=bottom]:top-[-8px] vocs:data-[side=left]:right-[-13px] vocs:data-[side=left]:rotate-90 vocs:data-[side=right]:left-[-13px] vocs:data-[side=right]:rotate-[-90deg] vocs:data-[side=top]:bottom-[-8px] vocs:data-[side=top]:rotate-180">
              <ArrowSvg />
            </Popover.Arrow>
            <div data-v-content ref={ref}>
              {children}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

export namespace TwoslashHover {
  export type Props = {
    className?: string | undefined
    children: React.ReactNode
    open?: boolean | undefined
    trigger: React.ReactNode
  }

  export function useOverflowFade() {
    const ref = useCallback((content: HTMLDivElement | null) => {
      if (!content) return
      const elements = content.querySelectorAll('[data-v-overflow-fade]')
      for (const el of elements) {
        if (!(el instanceof HTMLElement)) continue
        if (el.scrollHeight <= el.clientHeight) continue

        const sentinel = el.querySelector('[data-v-overflow-sentinel]')
        if (!sentinel) continue

        el.dataset['overflows'] = 'true'

        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry?.isIntersecting) delete el.dataset['overflows']
            else el.dataset['overflows'] = 'true'
          },
          { root: el, threshold: 0.5 },
        )
        observer.observe(sentinel)
      }
    }, [])

    return { ref }
  }
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <title>Arrow</title>
      <path
        className="vocs:fill-(--vocs-background-color-surface)"
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
      />
      <path
        className="vocs:fill-(--vocs-border-color-primary)"
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
      />
    </svg>
  )
}
