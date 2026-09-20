'use client'

import * as React from 'react'
import { style } from 'zyzz/default'

namespace styles {
  export const steps = style({
    selectors: {
      ':where(& > :not(:last-child))': {
        marginBlockStart: 'calc(calc(0.25rem * 6) * 0)',
        marginBlockEnd: 'calc(calc(0.25rem * 6) * calc(1 - 0))',
      },
    },
  })
  export const steps2 = style({
    selectors: {
      ':where(& > :not(:last-child))': {
        marginBlockStart: 'calc(calc(0.25rem * 6) * 0)',
        marginBlockEnd: 'calc(calc(0.25rem * 6) * calc(1 - 0))',
      },
    },
  })
}

export function Steps(props: React.PropsWithChildren<React.ComponentProps<'div'>>) {
  const children = React.Children.toArray(props.children)
  return (
    <div data-v data-v-steps>
      {children.map((child, i) => {
        // Skip non-element children (strings, null, etc.)
        if (typeof child !== 'object' || !('props' in child)) return null

        const childProps = child.props as { children?: React.ReactNode }
        const stepChildren = Array.isArray(childProps.children)
          ? childProps.children
          : [childProps.children]
        const [title, ...rest] = stepChildren

        // Handle case where title might be a string or missing/invalid type
        if (!title || typeof title !== 'object' || !('type' in title) || title.type === undefined) {
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: _
            <div {...styles.steps()} data-v-content key={i}>
              <div data-v-step-title>{title}</div>
              <div data-v-step-content>{rest}</div>
            </div>
          )
        }

        const TitleElement = title.type
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: _
          <div {...styles.steps2()} data-v-content key={i}>
            <TitleElement {...title.props} data-v-step-title />
            <div data-v-step-content>{rest}</div>
          </div>
        )
      })}
    </div>
  )
}
