import type { ReactElement } from 'react'

import * as Tabs from '../Tabs.js'
import * as styles from './CodeGroup.css.js'

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
      <Tabs.List aria-label="Code group">
        {tabs.map(({ title }, i) => (
          <Tabs.Trigger key={title || i.toString()} value={title || i.toString()}>
            {title}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map(({ title, content }, i) => {
        const isShiki = content.props?.className?.includes('shiki')
        return (
          <Tabs.Content
            key={title || i.toString()}
            data-shiki={isShiki}
            value={title || i.toString()}
          >
            {content}
          </Tabs.Content>
        )
      })}
    </Tabs.Root>
  )
}
