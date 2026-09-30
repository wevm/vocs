'use client'

import { Tabs } from '@base-ui/react/tabs'
import { useQueryState } from 'nuqs'
import * as React from 'react'
import { style, vars } from '../../styles/zyzz.config.js'

namespace styles {
  export const panels = style({
    display: 'grid',
  })

  export const panel = style({
    gridColumnStart: '1',
    gridRowStart: '1',
    minWidth: '0',
    selectors: {
      ':is(& > *)': {
        borderTopLeftRadius: '0 !custom',
        borderTopRightRadius: '0 !custom',
        borderTopStyle: 'solid',
        borderTopWidth: '0px',
      },
      '&[data-hidden]': {
        visibility: 'hidden',
      },
    },
  })

  export const panelContent = style({
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'code-block',
    padding: '5',
    '@media (width < 748px)': {
      marginInline: `calc(${vars.spacing.unit} * -4) !custom`,
      borderRadius: '0 !custom',
    },
    selectors: {
      ':where(& > :not(:last-child))': {
        marginBlockStart: '0 !custom',
        marginBlockEnd: '3',
      },
    },
  })
}

const packageManagers = new Set(['npm', 'pnpm', 'yarn', 'bun'])

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

export function CodeGroup(props: CodeGroup.Props) {
  const { children, syncKey } = props

  const items = React.Children.toArray(children)
    .map((child) => {
      const item =
        typeof child === 'object' &&
        'props' in child &&
        'data-title' in (child.props as React.ComponentProps<'div'>)
          ? (child.props as React.ComponentProps<'div'> & { 'data-title': string })
          : null
      if (!item) return null
      const title = item['data-title']
      return { title, value: toKebabCase(title), content: item.children }
    })
    .filter(Boolean) as { title: string; value: string; content: React.ReactNode }[]

  const pmCount = items.filter((item) => packageManagers.has(item.value)).length
  const isPackageManagerGroup = pmCount >= 2
  const effectiveSyncKey = syncKey ?? (isPackageManagerGroup ? 'pm' : undefined)

  if (!items.length) return null

  if (effectiveSyncKey) return <SyncedCodeGroup items={items} syncKey={effectiveSyncKey} />

  return (
    <Tabs.Root data-v-code-container data-v-code-group defaultValue={items[0]?.value}>
      <CodeGroupTabs items={items} />
      <CodeGroupPanels items={items} />
    </Tabs.Root>
  )
}

export declare namespace CodeGroup {
  export type Props = React.PropsWithChildren<
    React.ComponentProps<'div'> & {
      syncKey?: string | undefined
    }
  >
}

type CodeGroupItem = { title: string; value: string; content: React.ReactNode }

function SyncedCodeGroup(props: { items: CodeGroupItem[]; syncKey: string }) {
  const { items, syncKey } = props

  const [hasMounted, setHasMounted] = React.useState(false)
  const [tab, setTab] = useQueryState(syncKey, {
    defaultValue: items[0]?.value ?? '',
  })

  React.useEffect(() => {
    setHasMounted(true)
    const params = new URLSearchParams(window.location.search)
    if (!params.has(syncKey) && items[0]?.value) setTab(items[0].value)
  }, [syncKey, items, setTab])

  const activeTab = items.some((item) => item.value === tab) ? tab : items[0]?.value

  if (!hasMounted) return null

  return (
    <Tabs.Root
      data-v-code-container
      data-v-code-group
      onValueChange={(value) => setTab(value)}
      value={activeTab}
    >
      <CodeGroupTabs items={items} />
      <CodeGroupPanels items={items} />
    </Tabs.Root>
  )
}

function CodeGroupTabs({ items }: { items: CodeGroupItem[] }) {
  return (
    <Tabs.List aria-label="Code group" data-v-code-header data-v-code-group-list>
      {items.map(({ title, value }, i) => (
        <Tabs.Tab
          data-title={title}
          data-v-code-group-tab
          key={value || i.toString()}
          value={value || i.toString()}
        >
          {title.replace(/\s*~[^~]+~\s*$/, '')}
        </Tabs.Tab>
      ))}
    </Tabs.List>
  )
}

function CodeGroupPanels({ items }: { items: CodeGroupItem[] }) {
  return (
    <div {...styles.panels()}>
      {items.map(({ value, content }, i) => {
        const isCodeBlock =
          content &&
          typeof content === 'object' &&
          'props' in content &&
          'data-v-code-container' in (content.props as React.ComponentProps<'div'>)
        return (
          <Tabs.Panel
            {...styles.panel()}
            data-v-code-group-panel
            keepMounted
            key={value || i.toString()}
            value={value || i.toString()}
          >
            {isCodeBlock ? (
              <CodeBlock node={content} />
            ) : (
              <div {...styles.panelContent()}>{content}</div>
            )}
          </Tabs.Panel>
        )
      })}
    </div>
  )
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
