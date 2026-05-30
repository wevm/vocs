'use client'

import { Popover } from '@base-ui/react/popover'
import * as React from 'react'
import LucideInfo from '~icons/lucide/info'

export function InfoTooltip(props: InfoTooltip.Props) {
  const { content, label } = props
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`More info about ${label}`}
        className="vocs:bg-transparent vocs:border-0 vocs:p-0 vocs:m-0 vocs:cursor-pointer vocs:text-muted vocs:hover:text-primary vocs:focus-visible:text-primary vocs:focus-visible:outline-none vocs:size-4 vocs:flex vocs:items-center vocs:justify-center vocs:transition-colors"
        openOnHover
        delay={150}
        type="button"
      >
        <LucideInfo className="vocs:size-3.5" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="center" sideOffset={6}>
          <Popover.Popup className="vocs:max-w-[300px] vocs:bg-surface vocs:border vocs:border-primary vocs:rounded-md vocs:px-3 vocs:py-2 vocs:text-sm vocs:text-primary vocs:font-sans vocs:leading-snug vocs:shadow-md vocs:z-50">
            {content}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

export declare namespace InfoTooltip {
  type Props = {
    content: string
    label: string
  }
}

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
    tooltip,
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
        <div
          className="vocs:grid vocs:items-center vocs:gap-x-4 vocs:w-fit vocs:text-primary"
          style={rowStyle}
        >
          <span className="vocs:flex vocs:items-center vocs:gap-2 vocs:whitespace-nowrap vocs:justify-self-start">
            <button
              className="vocs:flex vocs:items-center vocs:gap-2 vocs:whitespace-nowrap vocs:bg-transparent vocs:p-0 vocs:m-0 vocs:not-disabled:cursor-pointer vocs:data-[highlighted=true]:bg-surfaceTint vocs:data-[highlighted=true]:border vocs:data-[highlighted=true]:border-primary vocs:rounded-md vocs:px-2 vocs:py-0.5 vocs:-mx-2 vocs:-my-0.5"
              data-highlighted={highlighted}
              data-open={isOpen}
              disabled={!hasChildren}
              onClick={() => setIsOpen(!isOpen)}
              type="button"
            >
              <span className="vocs:shrink-0">
                {isOpen && hasChildren ? folderOpenIcon : folderIcon}
              </span>
              <span>{name}</span>
            </button>
            {tooltip && <InfoTooltip content={tooltip} label={name} />}
          </span>
          {comment && <span className="vocs:text-muted vocs:whitespace-nowrap">{comment}</span>}
        </div>
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
    tooltip?: string | undefined
    hasChildren: boolean
    highlighted?: boolean | undefined
    labelColumnOffset: number
    folderContent?: React.ReactNode | undefined
  }
}
