import * as Tabs from '@radix-ui/react-tabs'
import type { ReactElement } from 'react'

import styles from './CodeGroup.module.css'

export function CodeGroup({ children }: { children: ReactElement[] }) {
  const tabs = children.map((child_) => {
    const child = child_.props['data-title'] ? child_ : child_.props.children
    const { props } = child
    const title = props['data-title'] as string
    const content = props.children as ReactElement
    return { title, content }
  })
  return (
    <Tabs.Root className={styles.root} defaultValue={tabs[0].title}>
      <Tabs.List className={styles['tabs-list']} aria-label="Code group">
        {tabs.map(({ title }, i) => (
          <Tabs.Trigger
            key={title || i.toString()}
            className={styles['tabs-trigger']}
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
            className={styles['tabs-content']}
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
