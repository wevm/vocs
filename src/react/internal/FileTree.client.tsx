'use client'

import { Popover } from '@base-ui/react/popover'
import * as React from 'react'
import LucideInfo from '~icons/lucide/info'

const triggerBaseClassName =
  'vocs:flex vocs:items-center vocs:gap-2 vocs:whitespace-nowrap vocs:justify-self-start vocs:rounded-md vocs:px-2 vocs:py-0.5 vocs:-mx-2 vocs:-my-0.5 vocs:border vocs:border-transparent vocs:transition-colors vocs:data-[highlighted=true]:bg-surfaceTint vocs:data-[highlighted=true]:border-primary'

const tooltipTriggerClassName =
  'vocs:hover:bg-surfaceTint vocs:hover:border-primary vocs:data-[popup-open]:bg-surfaceTint vocs:data-[popup-open]:border-primary'

const folderButtonClassName = 'vocs:bg-transparent vocs:m-0 vocs:not-disabled:cursor-pointer'

const popupClassName =
  'vocs:max-w-[300px] vocs:bg-surface vocs:border vocs:border-primary vocs:rounded-md vocs:px-3 vocs:py-2 vocs:text-sm vocs:text-primary vocs:font-sans vocs:leading-snug vocs:shadow-md vocs:z-50'

function InfoIndicator() {
  return (
    <span
      aria-hidden="true"
      className="vocs:shrink-0 vocs:flex vocs:items-center vocs:justify-center vocs:size-4 vocs:text-muted"
    >
      <LucideInfo className="vocs:size-3.5" />
    </span>
  )
}

/**
 * Wraps a file row's label area (icon + name) so the entire row becomes a
 * hover-activated popover trigger. The trigger gets the active-style
 * background and border while hovered or while the popover is open, and a
 * decorative info icon is appended to make the affordance discoverable.
 */
export function FileRowTrigger(props: FileRowTrigger.Props) {
  const { children, content, highlighted, label } = props
  return (
    <Popover.Root>
      <Popover.Trigger
        render={<span />}
        openOnHover
        delay={150}
        aria-label={`More info about ${label}`}
        data-highlighted={highlighted ? 'true' : undefined}
        className={`${triggerBaseClassName} ${tooltipTriggerClassName}`}
      >
        {children}
        <InfoIndicator />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="center" sideOffset={6}>
          <Popover.Popup className={popupClassName}>{content}</Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

export declare namespace FileRowTrigger {
  type Props = {
    children: React.ReactNode
    content: string
    label: string
    highlighted?: boolean | undefined
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

  const folderInner = (
    <>
      <span className="vocs:shrink-0">{isOpen && hasChildren ? folderOpenIcon : folderIcon}</span>
      <span>{name}</span>
    </>
  )

  return (
    <div className="vocs:flex vocs:flex-col vocs:overflow-visible">
      <div className="vocs:relative vocs:flex vocs:items-center vocs:py-1">
        <div
          className="vocs:grid vocs:items-center vocs:gap-x-4 vocs:w-fit vocs:text-primary"
          style={rowStyle}
        >
          {tooltip ? (
            <Popover.Root>
              <Popover.Trigger
                render={
                  <button
                    disabled={!hasChildren}
                    onClick={() => setIsOpen(!isOpen)}
                    type="button"
                  />
                }
                openOnHover
                delay={150}
                aria-label={`More info about ${name}`}
                data-highlighted={highlighted ? 'true' : undefined}
                data-open={isOpen}
                className={`${triggerBaseClassName} ${folderButtonClassName} ${tooltipTriggerClassName}`}
              >
                {folderInner}
                <InfoIndicator />
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner side="top" align="center" sideOffset={6}>
                  <Popover.Popup className={popupClassName}>{tooltip}</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          ) : (
            <button
              className={`${triggerBaseClassName} ${folderButtonClassName}`}
              data-highlighted={highlighted}
              data-open={isOpen}
              disabled={!hasChildren}
              onClick={() => setIsOpen(!isOpen)}
              type="button"
            >
              {folderInner}
            </button>
          )}
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
