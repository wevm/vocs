'use client'

import * as React from 'react'

export function Steps(props: React.PropsWithChildren<React.ComponentProps<'div'>>) {
  const children = React.Children.toArray(props.children)
  return (
    <div data-md data-steps>
      {/** biome-ignore lint/suspicious/noExplicitAny: _ */}
      {children.map(({ props }: any, i) => {
        const [title, ...children] = Array.isArray(props.children)
          ? props.children
          : [props.children]
        const TitleElement = title.type
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: _
          <div className="vocs:space-y-6" data-content key={i}>
            <TitleElement {...title.props} data-step-title />
            <div data-step-content>{children}</div>
          </div>
        )
      })}
    </div>
  )
}
