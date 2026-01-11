'use client'

import * as React from 'react'
import LucideFile from '~icons/lucide/file'
import LucideFolder from '~icons/lucide/folder'
import LucideFolderOpen from '~icons/lucide/folder-open'

export function FileTree(props: FileTree.Props) {
  const items: FileTree.Item[] = JSON.parse(props['data-v-file-tree-items'] ?? '[]')
  return (
    <div
      data-v
      data-v-file-tree
      className="vocs:bg-code-block vocs:py-4 vocs:px-5 vocs:rounded-lg vocs:border vocs:border-primary vocs:text-sm vocs:font-mono"
    >
      <FileTree.List items={items} depth={0} activeLines={[]} />
    </div>
  )
}

export namespace FileTree {
  export type Props = React.ComponentProps<'div'> & {
    'data-v-file-tree-items'?: string | undefined
  }

  export type Item = {
    name: string
    type: 'file' | 'folder'
    highlighted?: boolean
    items?: Item[]
  }

  const indentSize = 20
  const iconSize = 14

  export function List(props: List.Props) {
    const { items, depth, activeLines } = props
    return (
      <ul className="vocs:list-none vocs:p-0 vocs:m-0">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <FileTree.Item
              // biome-ignore lint/suspicious/noArrayIndexKey: _
              key={i}
              item={item}
              depth={depth}
              activeLines={activeLines}
              isLast={isLast}
            />
          )
        })}
      </ul>
    )
  }

  declare namespace List {
    type Props = {
      items: Item[]
      depth: number
      activeLines: number[]
    }
  }

  export function Item(props: Item.Props) {
    const { item, depth, activeLines, isLast } = props

    const [isOpen, setIsOpen] = React.useState(true)

    const childActiveLines = isLast ? activeLines : [...activeLines, depth]
    const isFolder = item.type === 'folder'
    const hasChildren = isFolder && item.items && item.items.length > 0
    const showChildren = hasChildren && isOpen

    return (
      <li className="vocs:relative">
        {activeLines.map((lineDepth) => (
          <div
            key={lineDepth}
            className="vocs:absolute vocs:top-0 vocs:bottom-0 vocs:border-l vocs:border-primary"
            style={{ left: lineDepth * indentSize + iconSize / 2 }}
          />
        ))}

        <div className="vocs:flex vocs:items-center vocs:py-1">
          <div style={{ width: depth * indentSize }} />
          {isFolder ? (
            <button
              className="vocs:flex vocs:items-center vocs:gap-2 vocs:not-disabled:cursor-pointer vocs:bg-transparent vocs:border-none vocs:p-0 vocs:m-0 vocs:text-secondary vocs:not-disabled:hover:text-heading  vocs:data-[highlighted=true]:text-heading vocs:data-[highlighted=true]:bg-surfaceTint vocs:data-[highlighted=true]:border vocs:data-[highlighted=true]:border-primary vocs:rounded-md vocs:px-2 vocs:py-0.5 vocs:-mx-2 vocs:-my-0.5"
              data-highlighted={item.highlighted}
              disabled={!hasChildren}
              onClick={() => setIsOpen(!isOpen)}
              type="button"
            >
              <span className="vocs:shrink-0">
                {isOpen && hasChildren ? (
                  <LucideFolderOpen className="vocs:size-4" />
                ) : (
                  <LucideFolder className="vocs:size-4" />
                )}
              </span>
              <span>{item.name}</span>
            </button>
          ) : (
            <div
              className="vocs:flex vocs:items-center vocs:gap-2 vocs:text-secondary vocs:data-[highlighted=true]:text-heading vocs:data-[highlighted=true]:bg-surfaceTint vocs:data-[highlighted=true]:border vocs:data-[highlighted=true]:border-primary vocs:rounded-md vocs:px-2 vocs:py-0.5 vocs:-mx-2 vocs:-my-0.5"
              data-highlighted={item.highlighted}
            >
              <span className="vocs:shrink-0">
                <LucideFile className="vocs:size-4" />
              </span>
              <span>{item.name}</span>
            </div>
          )}
        </div>

        {showChildren && item.items && (
          <List items={item.items} depth={depth + 1} activeLines={childActiveLines} />
        )}
      </li>
    )
  }

  declare namespace Item {
    type Props = {
      item: Item
      depth: number
      activeLines: number[]
      isLast: boolean
    }
  }
}
