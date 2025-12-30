'use client'

import * as React from 'react'

export function Steps(props: React.PropsWithChildren<React.ComponentProps<'div'>>) {
  const children = React.Children.toArray(props.children)
  return (
    <div
      data-md
      data-steps
      className="vocs:space-y-6 vocs:border-l-[1.5px] vocs:border-l-primary vocs:pl-6 vocs:ml-3 vocs:max-md:ml-1"
      style={{ counterReset: 'step' }}
    >
      {/** biome-ignore lint/suspicious/noExplicitAny: _ */}
      {children.map(({ props }: any, i) => {
        const [title, ...children] = Array.isArray(props.children)
          ? props.children
          : [props.children]
        const TitleElement = title.type
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: _
          <div className="vocs:space-y-6" data-content key={i}>
            <TitleElement
              {...title.props}
              className="vocs:p-0 vocs:relative vocs:flex vocs:items-center vocs:before:items-center vocs:before:bg-secondary vocs:before:rounded-full vocs:before:border-[0.5em] vocs:before:border-(--vocs-background-color-primary) vocs:before:box-content vocs:before:text-secondary vocs:before:[content:counter(step)]! vocs:before:[counter-increment:step] vocs:before:flex vocs:before:text-[0.625em] vocs:before:h-[2em] vocs:before:justify-center vocs:before:left-[calc(-25.125px-1.45em)] vocs:before:w-[2em] vocs:before:absolute vocs:before:font-normal"
            />
            <div className="vocs:-mt-2 vocs:space-y-6">{children}</div>
          </div>
        )
      })}
    </div>
  )
}
