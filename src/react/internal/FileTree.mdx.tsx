import { style, theme } from 'zyzz/default'
import LucideFile from '~icons/lucide/file'
import LucideFolder from '~icons/lucide/folder'
import LucideFolderOpen from '~icons/lucide/folder-open'
import { FileRowTrigger, FolderToggle } from './FileTree.client.js'

namespace styles {
  export const fileTree = style({
    overflowX: 'auto',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.background['200'],
    paddingInline: 5,
    paddingBlock: 4,
    fontFamily: theme.vars.fontFamily.mono,
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
  })
  export const list = style({
    margin: 0,
    listStyleType: 'none',
    overflow: 'visible',
  })
  export const list2 = style({ padding: 0 })
  export const list3 = style({
    borderLeftStyle: 'solid',
    borderLeftWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
  })
  export const item = style({ position: 'relative', overflow: 'visible' })
  export const item2 = style({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    paddingBlock: 1,
  })
  export const item3 = style({
    display: 'grid',
    alignItems: 'center',
    columnGap: 4,
    color: theme.vars.color.foreground,
  })
  export const item4 = style({ flexShrink: 0 })
  export const item5 = style({ color: theme.vars.color.gray['800'] })
  export const item6 = style({
    marginInline: 'calc(0.25rem * -2)',
    marginBlock: 'calc(0.25rem * -0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    justifySelf: 'flex-start',
    borderRadius: 'md',
    paddingInline: 2,
    paddingBlock: 'calc(0.25rem * 0.5)',
    whiteSpace: 'nowrap',
    selectors: {
      '&[data-highlighted="true"]': {
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: theme.vars.color.gray['400'],
        backgroundColor: theme.vars.color.gray['100'],
      },
    },
  })
  export const item7 = style({ flexShrink: 0 })
  export const item8 = style({ color: theme.vars.color.gray['800'] })
  export const item9 = style({ whiteSpace: 'nowrap', color: theme.vars.color.gray['800'] })
  export const folderIcon = style({
    width: 4,
    height: 4,
    color: theme.vars.color.gray['900'],
  })
  export const folderIcon2 = style({
    width: 4,
    height: 4,
    color: theme.vars.color.gray['900'],
  })
  export const fileIcon = style({
    selectors: { '& > svg': { width: 4, height: 4 } },
    display: 'flex',
    width: 4,
    height: 4,
    alignItems: 'center',
    justifyContent: 'center',
  })
  export const fileIcon2 = style({
    width: 4,
    height: 4,
    color: theme.vars.color.gray['900'],
  })
}

export function FileTree(props: FileTree.Props) {
  const items: FileTree.Item[] = JSON.parse(props['data-v-file-tree-items'] ?? '[]')

  return (
    <div
      data-v
      data-v-file-tree
      {...styles.fileTree()}
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
        className={`${styles.list().className} ${depth === 0 ? styles.list2().className : styles.list3().className}`}
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
          <div {...styles.item2()}>
            <div {...styles.item3()} style={rowStyle}>
              {item.tooltip ? (
                <FileRowTrigger
                  content={item.tooltip}
                  label={item.name}
                  highlighted={item.highlighted}
                >
                  {item.name !== '...' && (
                    <span {...styles.item4()}>
                      <FileIcon icon={item.icon} />
                    </span>
                  )}
                  <span className={item.name === '...' ? styles.item5().className : undefined}>
                    {item.name}
                  </span>
                </FileRowTrigger>
              ) : (
                <span {...styles.item6()} data-highlighted={item.highlighted}>
                  {item.name !== '...' && (
                    <span {...styles.item7()}>
                      <FileIcon icon={item.icon} />
                    </span>
                  )}
                  <span className={item.name === '...' ? styles.item8().className : undefined}>
                    {item.name}
                  </span>
                </span>
              )}
              {item.comment && <span {...styles.item9()}>{item.comment}</span>}
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
    if (open) return <LucideFolderOpen className={styles.folderIcon().className} />
    return <LucideFolder className={styles.folderIcon2().className} />
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
    return <LucideFile className={styles.fileIcon2().className} />
  }
}
