'use client'

import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { useQueryState } from 'nuqs'
import * as React from 'react'
import { style } from '../styles/zyzz.config.js'

namespace styles {
  export const tabList = style({
    display: 'flex',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    borderColor: 'primary',
  })

  export const tab = style({
    marginBottom: '-1px !custom',
    display: 'flex',
    height: '10',
    cursor: 'pointer',
    alignItems: 'center',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1.5px',
    borderColor: 'transparent !custom',
    paddingInline: '2',
    fontSize: '15px !custom',
    fontWeight: '350 !custom',
    color: 'secondary',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: '100ms !custom',
    selectors: {
      '&[data-active]': {
        borderColor: 'accent7',
        fontWeight: 'medium',
        color: 'heading',
      },
    },
  })

  export const panel = style({
    paddingTop: '4',
  })
}

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
      <BaseTabs.List {...styles.tabList()}>
        {tabs.map((t) => (
          <BaseTabs.Tab {...styles.tab()} key={t.value} value={t.value}>
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
    <BaseTabs.Panel {...styles.panel()} value={value}>
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
