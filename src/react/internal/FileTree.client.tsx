'use client'

import * as React from 'react'

export function FolderToggle(props: FolderToggle.Props) {
  const { folderIcon, folderOpenIcon, name, comment, hasChildren, highlighted, folderContent } =
    props
  const [isOpen, setIsOpen] = React.useState(true)

  return (
    <div className="vocs:flex vocs:flex-col vocs:overflow-visible">
      <button
        className="vocs:flex vocs:items-center vocs:w-fit vocs:gap-2 vocs:not-disabled:cursor-pointer vocs:bg-transparent vocs:p-0 vocs:m-0 vocs:text-primary vocs:data-[highlighted=true]:bg-surfaceTint vocs:data-[highlighted=true]:border vocs:data-[highlighted=true]:border-primary vocs:rounded-md vocs:px-2 vocs:py-0.5 vocs:-mx-2 vocs:-my-0.5 vocs:mb-1"
        data-highlighted={highlighted}
        data-open={isOpen}
        disabled={!hasChildren}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="vocs:shrink-0">{isOpen && hasChildren ? folderOpenIcon : folderIcon}</span>
        <span>{name}</span>
        {comment && <span className="vocs:text-muted vocs:ml-4">{comment}</span>}
      </button>
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
    folderContent?: React.ReactNode | undefined
  }
}
