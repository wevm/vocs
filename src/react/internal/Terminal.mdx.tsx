'use client'

import * as React from 'react'
import { style } from 'zyzz/default'

namespace styles {
  export const terminal = style({ display: 'flex', flexDirection: 'column' })
  export const terminal2 = style({
    selectors: { '& [data-v-code-container]': { marginBlock: 0 } },
  })
  export const terminal3 = style({
    selectors: {
      '& [data-v-code-container]': { borderTopLeftRadius: '0', borderTopRightRadius: '0' },
    },
  })
  export const terminal4 = style({
    selectors: {
      '& [data-v-code-container] pre': { borderTopLeftRadius: '0', borderTopRightRadius: '0' },
    },
  })
  export const terminal5 = style({
    selectors: {
      '& [data-v-code-container]': { borderBottomRightRadius: '0', borderBottomLeftRadius: '0' },
    },
  })
  export const terminal6 = style({
    selectors: {
      '& [data-v-code-container]': { borderBottomStyle: 'solid', borderBottomWidth: '0px' },
    },
  })
  export const terminal7 = style({
    selectors: {
      '& [data-v-code-container] pre': {
        borderBottomRightRadius: '0',
        borderBottomLeftRadius: '0',
      },
    },
  })
  export const terminal8 = style({
    selectors: {
      '& [data-v-code-container] pre': { borderBottomStyle: 'solid', borderBottomWidth: '0px' },
    },
  })
}

/**
 * Terminal component that stitches command and output code blocks together.
 * The first code block is the command (with copy button).
 * Subsequent code blocks are output (no copy, visually connected).
 */
export function Terminal(props: Terminal.Props) {
  const { children } = props

  const items = React.Children.toArray(children)
    .map((child) => {
      if (typeof child !== 'object' || !('props' in child)) return null
      const divProps = child.props as React.ComponentProps<'div'>
      if ('data-v-terminal-command' in divProps) {
        return { type: 'command' as const, content: divProps.children }
      }
      if ('data-v-terminal-output' in divProps) {
        return { type: 'output' as const, content: divProps.children }
      }
      return null
    })
    .filter(Boolean) as { type: 'command' | 'output'; content: React.ReactNode }[]

  if (!items.length) return null

  return (
    <div data-v-terminal-container {...styles.terminal()}>
      {items.map((item, i) => {
        const key = `${item.type}-${i}`
        const isFirst = i === 0
        const isLast = i === items.length - 1
        return (
          <div
            key={key}
            data-v-terminal-item
            data-v-terminal-type={item.type}
            className={[
              // Remove vertical margin on container
              styles.terminal2().className,
              // Top corners for non-first items (keep border for separator)
              !isFirst && [styles.terminal3().className, styles.terminal4().className].join(' '),
              // Bottom corners/border for non-last items (remove border to avoid double)
              !isLast &&
                [
                  styles.terminal5().className,
                  styles.terminal6().className,
                  styles.terminal7().className,
                  styles.terminal8().className,
                ].join(' '),
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {item.content}
          </div>
        )
      })}
    </div>
  )
}

export declare namespace Terminal {
  export type Props = React.PropsWithChildren<React.ComponentProps<'div'>>
}
