import LucideFile from '~icons/lucide/file'
import LucideFolder from '~icons/lucide/folder'
import LucideFolderOpen from '~icons/lucide/folder-open'
import { FolderToggle, InfoTooltip } from './FileTree.client.js'

export function FileTree(props: FileTree.Props) {
  const items: FileTree.Item[] = JSON.parse(props['data-v-file-tree-items'] ?? '[]')

  return (
    <div
      data-v
      data-v-file-tree
      className="vocs:bg-code-block vocs:py-4 vocs:px-5 vocs:rounded-lg vocs:border vocs:border-primary vocs:text-sm vocs:font-mono vocs:overflow-x-auto"
      style={
        {
          '--vocs-file-tree-label-column': FileTree.getLabelColumnSize(items),
        } as React.CSSProperties
      }
    >
      <FileTree.List items={items} depth={0} />
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
    comment?: string
    highlighted?: boolean
    icon?: string
    tooltip?: string
    items?: Item[]
  }

  const indentSize = 24
  const iconSize = 16
  const labelChromeSize = 5

  export function List(props: List.Props) {
    const { depth, items } = props
    return (
      <ul
        className={`vocs:list-none vocs:m-0 vocs:overflow-visible ${depth === 0 ? 'vocs:p-0' : 'vocs:border-l vocs:border-primary'}`}
        style={
          depth === 0
            ? undefined
            : {
                marginLeft: iconSize / 2 - 1,
                paddingLeft: indentSize - iconSize / 2,
              }
        }
      >
        {items.map((item, i) => (
          <FileTree.Item
            // biome-ignore lint/suspicious/noArrayIndexKey: _
            key={i}
            item={item}
            depth={depth}
          />
        ))}
      </ul>
    )
  }

  declare namespace List {
    type Props = {
      items: Item[]
      depth: number
    }
  }

  export function Item(props: Item.Props) {
    const { depth, item } = props

    const isFolder = item.type === 'folder'
    const hasChildren = isFolder && item.items && item.items.length > 0
    const rowStyle = item.comment
      ? {
          gridTemplateColumns: `calc(var(--vocs-file-tree-label-column) - ${depth * indentSize}px) max-content`,
        }
      : undefined

    return (
      <li className="vocs:relative vocs:overflow-visible">
        {isFolder ? (
          <FolderToggle
            name={item.name}
            comment={item.comment}
            tooltip={item.tooltip}
            hasChildren={!!hasChildren}
            highlighted={item.highlighted}
            labelColumnOffset={depth * indentSize}
            folderIcon={<FolderIcon open={false} />}
            folderOpenIcon={<FolderIcon open={true} />}
            folderContent={
              hasChildren && item.items && <List items={item.items} depth={depth + 1} />
            }
          />
        ) : (
          <div className="vocs:relative vocs:flex vocs:items-center vocs:py-1">
            <div
              className="vocs:grid vocs:items-center vocs:gap-x-4 vocs:text-primary"
              style={rowStyle}
            >
              <span
                className="vocs:flex vocs:items-center vocs:gap-2 vocs:whitespace-nowrap vocs:justify-self-start vocs:data-[highlighted=true]:bg-surfaceTint vocs:data-[highlighted=true]:border vocs:data-[highlighted=true]:border-primary vocs:rounded-md vocs:px-2 vocs:py-0.5 vocs:-mx-2 vocs:-my-0.5"
                data-highlighted={item.highlighted}
              >
                {item.name !== '...' && (
                  <span className="vocs:shrink-0">
                    <FileIcon icon={item.icon} />
                  </span>
                )}
                <span className={item.name === '...' ? 'vocs:text-muted' : undefined}>
                  {item.name}
                </span>
                {item.tooltip && <InfoTooltip content={item.tooltip} label={item.name} />}
              </span>
              {item.comment && (
                <span className="vocs:text-muted vocs:whitespace-nowrap">{item.comment}</span>
              )}
            </div>
          </div>
        )}
      </li>
    )
  }

  declare namespace Item {
    type Props = {
      item: Item
      depth: number
    }
  }

  export function getLabelColumnSize(items: Item[]) {
    let max = 0
    let value = '0px'

    function walk(items: Item[], depth: number) {
      for (const item of items) {
        const chromeSize = item.name === '...' ? 0 : labelChromeSize
        const size = depth * indentSize + (item.name.length + chromeSize) * 8
        if (size > max) {
          max = size
          value = `calc(${depth * indentSize}px + ${item.name.length + chromeSize}ch)`
        }
        if (item.items) walk(item.items, depth + 1)
      }
    }

    walk(items, 0)
    return value
  }

  function FolderIcon({ open }: { open: boolean }) {
    if (open) return <LucideFolderOpen className="vocs:size-4 vocs:text-secondary" />
    return <LucideFolder className="vocs:size-4 vocs:text-secondary" />
  }

  function FileIcon({ icon }: { icon: string | undefined }) {
    if (icon) {
      return (
        <span
          className="vocs:size-4 vocs:flex vocs:items-center vocs:justify-center [&>svg]:vocs:size-4"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: resolved SVG from iconify at build time
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      )
    }
    return <LucideFile className="vocs:size-4 vocs:text-secondary" />
  }
}
