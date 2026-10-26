'use client'

import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { cx } from 'cva'
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

  // Server rendering has no effects, so render every panel there (with the first
  // tab active) and switch to the URL's tab after mount, which keeps hydration
  // consistent and puts all tab content in the HTML.
  const value = hasMounted ? tab : (tabs[0]?.value ?? '')

  return (
    <BaseTabs.Root onValueChange={(value) => setTab(value)} value={value}>
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
  const { className, title, children } = props
  const value = toKebabCase(title)
  return (
    // Inactive panels stay mounted (hidden) so their state survives tab switches,
    // and render as page content so Markdown blocks and headings inside a tab
    // get the same spacing and heading styles as the rest of the page.
    <BaseTabs.Panel
      className={cx('vocs:pt-4 vocs:space-y-6', className)}
      data-v-content
      keepMounted
      render={<article />}
      value={value}
    >
      {children}
    </BaseTabs.Panel>
  )
}

export declare namespace Tab {
  type Props = {
    children: React.ReactNode
    className?: string | undefined
    title: string
  }
}
