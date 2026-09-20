'use client'

import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import { useQueryState } from 'nuqs'
import * as React from 'react'
import { style, theme } from 'zyzz/default'

namespace styles {
  export const tabs = style({
    display: 'flex',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
  })
  export const tabs2 = style({
    marginBottom: '-1px',
    display: 'flex',
    height: 10,
    cursor: 'pointer',
    alignItems: 'center',
    borderBottomStyle: 'solid',
    borderBottomWidth: '1.5px',
    borderColor: 'transparent',
    paddingInline: 2,
    fontSize: '15px',
    fontWeight: 350,
    color: theme.vars.color.gray['900'],
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '100ms',
    selectors: {
      '&[data-active]': {
        borderColor: theme.vars.color.blue['700'],
        fontWeight: 'medium',
        color: theme.vars.color.foreground,
        borderBottomStyle: 'solid',
        transitionProperty:
          'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  })
  export const tab = style({ paddingTop: 4 })
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
      <BaseTabs.List className={styles.tabs().className}>
        {tabs.map((t) => (
          <BaseTabs.Tab className={styles.tabs2().className} key={t.value} value={t.value}>
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
    <BaseTabs.Panel className={styles.tab().className} value={value}>
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
