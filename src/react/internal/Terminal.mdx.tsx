'use client'

import * as React from 'react'

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
    <div data-v-terminal-container className="vocs:flex vocs:flex-col">
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
              'vocs:[&_[data-v-code-container]]:my-0',
              // Top corners for non-first items (keep border for separator)
              !isFirst &&
                [
                  'vocs:[&_[data-v-code-container]]:rounded-t-none',
                  'vocs:[&_[data-v-code-container]_pre]:rounded-t-none',
                ].join(' '),
              // Bottom corners/border for non-last items (remove border to avoid double)
              !isLast &&
                [
                  'vocs:[&_[data-v-code-container]]:rounded-b-none',
                  'vocs:[&_[data-v-code-container]]:border-b-0',
                  'vocs:[&_[data-v-code-container]_pre]:rounded-b-none',
                  'vocs:[&_[data-v-code-container]_pre]:border-b-0',
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
