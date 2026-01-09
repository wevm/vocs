'use client'

import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { useQueryState } from 'nuqs'
import * as React from 'react'

let tabsCounter = 0

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

export function Tabs(props: Tabs.Props) {
  const { children } = props

  const [hasMounted, setHasMounted] = React.useState(false)

  const tabs = React.useMemo(() => {
    const result: { value: string; title: string }[] = []
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const title = (child.props as { title?: string }).title
        if (title) {
          const value = toKebabCase(title)
          result.push({ value, title })
        }
      }
    })
    return result
  }, [children])

  const stateKey = React.useMemo(() => {
    if (props.stateKey) return props.stateKey
    tabsCounter++
    return `tab-${tabsCounter}`
  }, [props.stateKey])

  const [tab, setTab] = useQueryState(stateKey, {
    defaultValue: tabs[0]?.value ?? '',
  })

  React.useEffect(() => {
    setHasMounted(true)

    const params = new URLSearchParams(window.location.search)
    if (!params.has(stateKey) && tabs[0]?.value) setTab(tabs[0].value)
  }, [stateKey, tabs, setTab])

  if (!hasMounted) return null

  return (
    <BaseTabs.Root onValueChange={(value) => setTab(value)} value={tab}>
      <BaseTabs.List className="vocs:flex vocs:border-b vocs:border-primary">
        {tabs.map((t) => (
          <BaseTabs.Tab
            className="vocs:flex vocs:-mb-px vocs:h-10 vocs:cursor-pointer vocs:items-center vocs:border-b-[1.5px] vocs:border-transparent vocs:px-2 vocs:text-[15px] vocs:font-[350] vocs:text-secondary vocs:data-active:border-accent7 vocs:data-active:text-heading vocs:data-active:font-medium vocs:transition-colors vocs:duration-100"
            key={t.value}
            value={t.value}
          >
            {t.title}
          </BaseTabs.Tab>
        ))}
      </BaseTabs.List>
      {children}
    </BaseTabs.Root>
  )
}

export declare namespace Tabs {
  export type Props = {
    children: React.ReactNode
    stateKey?: string | undefined
  }
}

export function Tab(props: Tab.Props) {
  const { title, children } = props
  const value = toKebabCase(title)
  return (
    <BaseTabs.Panel className="vocs:pt-4" value={value}>
      {children}
    </BaseTabs.Panel>
  )
}

export declare namespace Tab {
  type Props = {
    children: React.ReactNode
    title: string
  }
}
