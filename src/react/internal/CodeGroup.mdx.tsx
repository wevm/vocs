'use client'

import { Tabs } from '@base-ui/react/tabs'
import * as React from 'react'

export function CodeGroup(props: CodeGroup.Props) {
  const { children } = props

  const items = React.Children.toArray(children)
    .map((child) => {
      const item =
        typeof child === 'object' &&
        'props' in child &&
        'data-title' in (child.props as React.ComponentProps<'div'>)
          ? (child.props as React.ComponentProps<'div'> & { 'data-title': string })
          : null
      if (!item) return null
      return { title: item['data-title'], content: item.children }
    })
    .filter(Boolean) as { title: string; content: React.ReactNode }[]
  if (!items) return null

  return (
    <Tabs.Root data-code-group defaultValue={items[0]?.title}>
      <Tabs.List
        className="vocs:h-10 vocs:bg-primary vocs:rounded-t-lg vocs:max-md:rounded-none vocs:text-sm vocs:bg-gray14 vocs:px-2 vocs:max-md:px-1 vocs:flex vocs:items-center vocs:border vocs:border-primary vocs:max-md:-mx-4"
        data-code-group-list
        aria-label="Code group"
      >
        {items.map(({ title }, i) => (
          <Tabs.Tab
            className="vocs:h-full vocs:text-secondary vocs:data-active:text-heading vocs:hover:text-heading vocs:font-medium vocs:tracking-tight vocs:px-3 vocs:-mb-[1.5px] vocs:border-b-[1.5px] vocs:border-b-transparent vocs:data-active:border-b-tab-active vocs:transition-colors vocs:duration-200"
            key={title || i.toString()}
            value={title || i.toString()}
          >
            {title}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {items.map(({ title, content }, i) => {
        const isCodeBlock =
          content && typeof content === 'object' && 'type' in content && content.type === 'pre'
        return (
          <Tabs.Panel
            className="vocs:*:rounded-t-none vocs:*:border-t-0"
            data-code-group-panel
            key={title || i.toString()}
            value={title || i.toString()}
          >
            {isCodeBlock ? (
              content
            ) : (
              <div className="vocs:bg-code-block vocs:border vocs:border-primary vocs:rounded-lg vocs:p-5 vocs:max-md:-mx-4 vocs:max-md:rounded-none">
                {content}
              </div>
            )}
          </Tabs.Panel>
        )
      })}
    </Tabs.Root>
  )
}

export declare namespace CodeGroup {
  export type Props = React.PropsWithChildren<React.ComponentProps<'div'>>
}
