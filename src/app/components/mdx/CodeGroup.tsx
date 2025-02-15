import type { ReactElement } from 'react'

import * as Tabs from '../Tabs.js'
import * as styles from './CodeGroup.css.js'

export function CodeGroup({ children }: { children: ReactElement[] }) {
  if (!Array.isArray(children)) return null
  const tabs = children.map((child_: any) => {
    const child = child_.props['data-title'] ? child_ : child_.props.children
    const { props } = child
    const title = (props as { 'data-title'?: string })['data-title'] as string
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
      {tabs.map(({ title, content }: any, i) => {
        const isShiki = content.props?.children?.props?.className?.includes('shiki')
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
