import * as Tabs from '@radix-ui/react-tabs'
import type { ReactElement } from 'react'

export function CodeGroup({ children }: { children: ReactElement[] }) {
  const tabs = children.map((child_) => {
    const child = child_.props['data-title'] ? child_ : child_.props.children
    const { props } = child
    const title = props['data-title'] as string
    const content = props.children as ReactElement
    return { title, content }
  })
  return (
    <Tabs.Root className="code-group" defaultValue={tabs[0].title}>
      <Tabs.List className="code-group--tabs-list" aria-label="Code group">
        {tabs.map(({ title }, i) => (
          <Tabs.Trigger
            key={title || i.toString()}
            className="code-group--tabs-trigger"
            value={title || i.toString()}
          >
            {title}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map(({ title, content }, i) => {
        const isPrettyCode = content.props && 'data-rehype-pretty-code-fragment' in content.props
        return (
          <Tabs.Content
            key={title || i.toString()}
            className="code-group--tabs-content"
            data-pretty-code={isPrettyCode}
            value={title || i.toString()}
          >
            {content}
          </Tabs.Content>
        )
      })}
    </Tabs.Root>
  )
}
