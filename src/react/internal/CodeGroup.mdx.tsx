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
    <Tabs.Root data-code-container data-code-group defaultValue={items[0]?.title}>
      <Tabs.List aria-label="Code group" data-code-header data-code-group-list>
        {items.map(({ title }, i) => (
          <Tabs.Tab data-code-group-tab key={title || i.toString()} value={title || i.toString()}>
            {title}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {items.map(({ title, content }, i) => {
        const isCodeBlock =
          content &&
          typeof content === 'object' &&
          'props' in content &&
          'data-code-container' in (content.props as React.ComponentProps<'div'>)
        return (
          <Tabs.Panel
            className="vocs:*:rounded-t-none vocs:*:border-t-0"
            data-code-group-panel
            key={title || i.toString()}
            value={title || i.toString()}
          >
            {isCodeBlock ? (
              <CodeBlock node={content} />
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

function CodeBlock({ node }: { node: React.ReactNode }): React.ReactElement | null {
  if (!React.isValidElement(node)) return null
  if (node.type === 'pre') return node
  const children = React.Children.toArray((node.props as { children?: React.ReactNode })?.children)
  for (const child of children) {
    const found = CodeBlock({ node: child })
    if (found) return found
  }
  return null
}
