import * as Tabs from '@radix-ui/react-tabs'
import clsx from 'clsx'

import * as styles from './Tabs.css.js'

export function Root(props: Tabs.TabsProps) {
  return <Tabs.Root {...props} className={clsx(props.className, styles.root)} />
}

export function List(props: Tabs.TabsListProps) {
  return <Tabs.List {...props} className={clsx(props.className, styles.list)} />
}

export function Trigger(props: Tabs.TabsTriggerProps) {
  return <Tabs.Trigger {...props} className={clsx(props.className, styles.trigger)} />
}

export function Content(props: Tabs.TabsContentProps) {
  return <Tabs.Content {...props} className={clsx(props.className, styles.content)} />
}
