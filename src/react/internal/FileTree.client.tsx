'use client'

import * as React from 'react'

export function FolderToggle(props: FolderToggle.Props) {
  const {
    comment,
    folderContent,
    folderIcon,
    folderOpenIcon,
    hasChildren,
    highlighted,
    labelColumnOffset,
    name,
  } = props
  const [isOpen, setIsOpen] = React.useState(true)
  const rowStyle = comment
    ? {
        gridTemplateColumns: `calc(var(--vocs-file-tree-label-column) - ${labelColumnOffset}px) max-content`,
      }
    : undefined

  return (
    <div className="vocs:flex vocs:flex-col vocs:overflow-visible">
      <div className="vocs:relative vocs:flex vocs:items-center vocs:py-1">
        <button
          className="vocs:grid vocs:items-center vocs:gap-x-4 vocs:w-fit vocs:bg-transparent vocs:p-0 vocs:m-0 vocs:text-primary vocs:not-disabled:cursor-pointer"
          data-open={isOpen}
          disabled={!hasChildren}
          onClick={() => setIsOpen(!isOpen)}
          style={rowStyle}
          type="button"
        >
          <span
            className="vocs:flex vocs:items-center vocs:gap-2 vocs:whitespace-nowrap vocs:justify-self-start vocs:data-[highlighted=true]:bg-surfaceTint vocs:data-[highlighted=true]:border vocs:data-[highlighted=true]:border-primary vocs:rounded-md vocs:px-2 vocs:py-0.5 vocs:-mx-2 vocs:-my-0.5"
            data-highlighted={highlighted}
          >
            <span className="vocs:shrink-0">
              {isOpen && hasChildren ? folderOpenIcon : folderIcon}
            </span>
            <span>{name}</span>
          </span>
          {comment && <span className="vocs:text-muted vocs:whitespace-nowrap">{comment}</span>}
        </button>
      </div>
      {hasChildren && isOpen && folderContent}
    </div>
  )
}

export declare namespace FolderToggle {
  type Props = {
    folderIcon: React.ReactNode
    folderOpenIcon: React.ReactNode
    name: string
    comment?: string | undefined
    hasChildren: boolean
    highlighted?: boolean | undefined
    labelColumnOffset: number
    folderContent?: React.ReactNode | undefined
  }
}
