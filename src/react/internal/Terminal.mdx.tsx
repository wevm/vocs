'use client'

import * as React from 'react'
import { cx } from 'zyzz'
import { style } from '../../styles/zyzz.config.js'

/**
 * Terminal component that stitches command and output code blocks together.
 * The first code block is the command (with copy button).
 * Subsequent code blocks are output (no copy, visually connected).
 */

namespace styles {
  export const root = style({
    display: 'flex',
    flexDirection: 'column',
  })

  export const item = style({
    selectors: {
      '& [data-v-code-container]': {
        marginBlock: '0',
      },
    },
  })

  export const joinedTop = style({
    selectors: {
      '& [data-v-code-container], & [data-v-code-container] pre': {
        borderTopLeftRadius: '0 !custom',
        borderTopRightRadius: '0 !custom',
      },
    },
  })

  export const joinedBottom = style({
    selectors: {
      '& [data-v-code-container], & [data-v-code-container] pre': {
        borderBottomRightRadius: '0 !custom',
        borderBottomLeftRadius: '0 !custom',
        borderBottomStyle: 'solid',
        borderBottomWidth: '0px',
      },
    },
  })
}

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
    <div data-v-terminal-container {...styles.root()}>
      {items.map((item, i) => {
        const key = `${item.type}-${i}`
        const isFirst = i === 0
        const isLast = i === items.length - 1
        return (
          <div
            key={key}
            data-v-terminal-item
            data-v-terminal-type={item.type}
            {...cx(styles.item(), !isFirst && styles.joinedTop(), !isLast && styles.joinedBottom())}
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
