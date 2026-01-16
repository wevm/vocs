import { config } from 'virtual:vocs/config'
import LucideFile from '~icons/lucide/file'
import LucideFolder from '~icons/lucide/folder'
import LucideFolderOpen from '~icons/lucide/folder-open'
import * as Icons from '../../internal/icons.js'
import { FolderToggle } from './FileTree.client.js'

export async function FileTree(props: FileTree.Props) {
  const items: FileTree.Item[] = JSON.parse(props['data-v-file-tree-items'] ?? '[]')
  const customIcons = config.groupIcons?.customIcons

  const iconCache = new Map<string, string | undefined>()
  await resolveAllIcons(items, customIcons, iconCache)

  return (
    <div
      data-v
      data-v-file-tree
      className="vocs:bg-code-block vocs:py-4 vocs:px-5 vocs:rounded-lg vocs:border vocs:border-primary vocs:text-sm vocs:font-mono"
    >
      <FileTree.List items={items} depth={0} activeLines={[]} iconCache={iconCache} />
    </div>
  )
}

async function resolveAllIcons(
  items: FileTree.Item[],
  customIcons: Record<string, string> | undefined,
  cache: Map<string, string | undefined>,
): Promise<void> {
  await Promise.all(
    items.map(async (item) => {
      if (item.type === 'file' && !cache.has(item.name)) {
        const iconId = Icons.matchIcon(item.name, customIcons)
        if (iconId) {
          const svg = await Icons.resolveIcon(iconId)
          cache.set(item.name, svg)
        } else {
          cache.set(item.name, undefined)
        }
      }
      if (item.items) await resolveAllIcons(item.items, customIcons, cache)
    }),
  )
}

export namespace FileTree {
  export type Props = React.ComponentProps<'div'> & {
    'data-v-file-tree-items'?: string | undefined
  }

  export type Item = {
    name: string
    type: 'file' | 'folder'
    comment?: string
    highlighted?: boolean
    items?: Item[]
  }

  const indentSize = 24
  const iconSize = 16

  export function List(props: List.Props) {
    const { items, depth, activeLines, iconCache } = props
    return (
      <ul className="vocs:list-none vocs:p-0 vocs:m-0 vocs:overflow-visible">
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
              iconCache={iconCache}
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
      iconCache: Map<string, string | undefined>
    }
  }

  export function Item(props: Item.Props) {
    const { item, depth, activeLines, isLast, iconCache } = props

    const isFolder = item.type === 'folder'
    const hasChildren = isFolder && item.items && item.items.length > 0

    const linesToRender = activeLines
    const childActiveLines = hasChildren ? [...activeLines, depth] : activeLines

    return (
      <li className="vocs:relative vocs:overflow-visible">
        {linesToRender.map((lineDepth) => (
          <div
            key={lineDepth}
            className="vocs:absolute vocs:top-0 vocs:bottom-0 vocs:border-l vocs:border-primary"
            style={{
              left: (lineDepth - (depth > 1 ? depth - 1 : 0)) * indentSize + iconSize / 2 - 1,
            }}
          />
        ))}

        <div className="vocs:flex vocs:items-center vocs:py-1">
          <div style={{ width: depth > 0 ? indentSize : 0 }} />
          {isFolder ? (
            <FolderToggle
              name={item.name}
              comment={item.comment}
              hasChildren={!!hasChildren}
              highlighted={item.highlighted}
              folderIcon={<FolderIcon open={false} />}
              folderOpenIcon={<FolderIcon open={true} />}
              folderContent={
                hasChildren &&
                item.items && (
                  <List
                    items={item.items}
                    depth={depth + 1}
                    activeLines={childActiveLines}
                    iconCache={iconCache}
                  />
                )
              }
            />
          ) : (
            <div
              className="vocs:flex vocs:items-center vocs:gap-2 vocs:text-primary vocs:data-[highlighted=true]:bg-surfaceTint vocs:data-[highlighted=true]:border vocs:data-[highlighted=true]:border-primary vocs:rounded-md vocs:px-2 vocs:py-0.5 vocs:-mx-2 vocs:-my-0.5"
              data-highlighted={item.highlighted}
            >
              {item.name !== '...' && (
                <span className="vocs:shrink-0">
                  <FileIcon name={item.name} iconCache={iconCache} />
                </span>
              )}
              <span className={item.name === '...' ? 'vocs:text-muted' : undefined}>
                {item.name}
              </span>
              {item.comment && <span className="vocs:text-muted vocs:ml-4">{item.comment}</span>}
            </div>
          )}
        </div>
      </li>
    )
  }

  declare namespace Item {
    type Props = {
      item: Item
      depth: number
      activeLines: number[]
      isLast: boolean
      iconCache: Map<string, string | undefined>
    }
  }

  function FolderIcon({ open }: { open: boolean }) {
    if (open) return <LucideFolderOpen className="vocs:size-4 vocs:text-secondary" />
    return <LucideFolder className="vocs:size-4 vocs:text-secondary" />
  }

  function FileIcon({
    name,
    iconCache,
  }: {
    name: string
    iconCache: Map<string, string | undefined>
  }) {
    const svg = iconCache.get(name)
    if (svg) {
      return (
        <span
          className="vocs:size-4 vocs:flex vocs:items-center vocs:justify-center [&>svg]:vocs:size-4"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: resolved SVG from iconify
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      )
    }
    return <LucideFile className="vocs:size-4 vocs:text-secondary" />
  }
}
