'use client'

import { Tabs } from '@base-ui/react/tabs'
import { useQueryState } from 'nuqs'
import * as React from 'react'

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
    <>
      {items.map(({ value, content }, i) => {
        const isCodeBlock =
          content &&
          typeof content === 'object' &&
          'props' in content &&
          'data-v-code-container' in (content.props as React.ComponentProps<'div'>)
        return (
          <Tabs.Panel
            className="vocs:*:rounded-t-none vocs:*:border-t-0"
            data-v-code-group-panel
            key={value || i.toString()}
            value={value || i.toString()}
          >
            {isCodeBlock ? (
              <CodeBlock node={content} />
            ) : (
              <div className="vocs:bg-code-block vocs:border vocs:border-primary vocs:rounded-lg vocs:p-5 vocs:max-md:-mx-4 vocs:max-md:rounded-none">
                {content}
              </div>
            )}
          </Tabs.Panel>
        )
      })}
    </>
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
