import { cx } from 'zyzz'
import LucideFile from '~icons/lucide/file'
import LucideFolder from '~icons/lucide/folder'
import LucideFolderOpen from '~icons/lucide/folder-open'
import { style, vars } from '../../styles/zyzz.config.js'
import { FileRowTrigger, FolderToggle } from './FileTree.client.js'

namespace styles {
  export const root = style({
    overflowX: 'auto',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'code-block',
    paddingInline: '5',
    paddingBlock: '4',
    fontFamily: 'mono',
    fontSize: 'sm',
    lineHeight: 'sm',
  })

  export const rootList = style({
    padding: '0',
  })

  export const nestedList = style({
    borderLeftStyle: 'solid',
    borderLeftWidth: '1px',
    borderColor: 'primary',
  })

  export const item = style({
    position: 'relative',
    overflow: 'visible',
  })

  export const itemRow = style({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    paddingBlock: '1',
  })

  export const label = style({
    display: 'grid',
    alignItems: 'center',
    columnGap: '4',
    color: 'primary',
  })

  export const iconContainer = style({
    flexShrink: 0,
  })

  export const ellipsis = style({
    color: 'muted',
  })

  export const name = style({
    marginInline: `calc(${vars.spacing.unit} * -2) !custom`,
    marginBlock: `calc(${vars.spacing.unit} * -0.5) !custom`,
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    justifySelf: 'flex-start',
    borderRadius: 'md',
    paddingInline: '2',
    paddingBlock: 'half',
    whiteSpace: 'nowrap',
    selectors: {
      '&[data-highlighted="true"]': {
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: 'primary',
        backgroundColor: 'surfaceTint',
      },
    },
  })

  export const comment = style({
    whiteSpace: 'nowrap',
    color: 'muted',
  })

  export const folderIcon = style({
    width: '4',
    height: '4',
    color: 'secondary',
  })

  export const list = style({
    margin: '0',
    listStyleType: 'none',
    overflow: 'visible',
  })

  export const fileIcon = style({
    display: 'flex',
    width: '4',
    height: '4',
    alignItems: 'center',
    justifyContent: 'center',
  })
}

export function FileTree(props: FileTree.Props) {
  const items: FileTree.Item[] = JSON.parse(props['data-v-file-tree-items'] ?? '[]')

  return (
    <div
      data-v
      data-v-file-tree
      {...styles.root()}
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
        {...cx(
          styles.list(),
          depth === 0 && styles.rootList(),
          !(depth === 0) && styles.nestedList(),
        )}
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
      <li {...styles.item()}>
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
          <div {...styles.itemRow()}>
            <div {...styles.label()} style={rowStyle}>
              {item.tooltip ? (
                <FileRowTrigger
                  content={item.tooltip}
                  label={item.name}
                  highlighted={item.highlighted}
                >
                  {item.name !== '...' && (
                    <span {...styles.iconContainer()}>
                      <FileIcon icon={item.icon} />
                    </span>
                  )}
                  <span {...cx(item.name === '...' && styles.ellipsis())}>{item.name}</span>
                </FileRowTrigger>
              ) : (
                <span {...styles.name()} data-highlighted={item.highlighted}>
                  {item.name !== '...' && (
                    <span {...styles.iconContainer()}>
                      <FileIcon icon={item.icon} />
                    </span>
                  )}
                  <span {...cx(item.name === '...' && styles.ellipsis())}>{item.name}</span>
                </span>
              )}
              {item.comment && <span {...styles.comment()}>{item.comment}</span>}
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
    if (open) return <LucideFolderOpen {...styles.folderIcon()} />
    return <LucideFolder {...styles.folderIcon()} />
  }

  function FileIcon({ icon }: { icon: string | undefined }) {
    if (icon) {
      return (
        <span
          {...styles.fileIcon()}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: resolved SVG from iconify at build time
          dangerouslySetInnerHTML={{ __html: icon }}
        />
      )
    }
    return <LucideFile {...styles.folderIcon()} />
  }
}
