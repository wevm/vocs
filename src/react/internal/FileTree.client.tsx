'use client'

import { Popover } from '@base-ui/react/popover'
import * as React from 'react'
import { style, theme } from 'zyzz/default'
import LucideInfo from '~icons/lucide/info'

namespace styles {
  export const element = style({
    marginInline: 'calc(0.25rem * -2)',
    marginBlock: 'calc(0.25rem * -0.5)',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    justifySelf: 'flex-start',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'transparent',
    paddingInline: 2,
    paddingBlock: 'calc(0.25rem * 0.5)',
    whiteSpace: 'nowrap',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&[data-highlighted="true"]': {
        borderColor: theme.vars.color.gray['400'],
        backgroundColor: theme.vars.color.gray['100'],
      },
    },
  })
  export const element2 = style({
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          borderColor: theme.vars.color.gray['400'],
          backgroundColor: theme.vars.color.gray['100'],
        },
      },
      '&[data-popup-open]': {
        borderColor: theme.vars.color.gray['400'],
        backgroundColor: theme.vars.color.gray['100'],
      },
    },
  })
  export const element3 = style({
    margin: 0,
    backgroundColor: 'transparent',
    selectors: { '&:not(*:disabled)': { cursor: 'pointer' } },
  })
  export const element4 = style({
    lineHeight: 'calc(1.25 / 0.875)',
    zIndex: 50,
    maxWidth: '300px',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    paddingInline: 3,
    paddingBlock: 2,
    fontFamily: theme.vars.fontFamily.sans,
    fontSize: 'sm',
    color: theme.vars.color.foreground,
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  })
  export const infoIndicator = style({
    display: 'flex',
    width: 4,
    height: 4,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.vars.color.gray['800'],
  })
  export const infoIndicator2 = style({
    width: 'calc(0.25rem * 3.5)',
    height: 'calc(0.25rem * 3.5)',
  })
  export const folderToggle = style({ flexShrink: 0 })
  export const folderToggle2 = style({
    display: 'flex',
    flexDirection: 'column',
    overflow: 'visible',
  })
  export const folderToggle3 = style({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    paddingBlock: 1,
  })
  export const folderToggle4 = style({
    display: 'grid',
    width: 'fit-content',
    alignItems: 'center',
    columnGap: 4,
    color: theme.vars.color.foreground,
  })
  export const folderToggle5 = style({ whiteSpace: 'nowrap', color: theme.vars.color.gray['800'] })
}

const triggerBaseClassName = styles.element().className

const tooltipTriggerClassName = styles.element2().className

const folderButtonClassName = styles.element3().className

const popupClassName = styles.element4().className

function InfoIndicator() {
  return (
    <span aria-hidden="true" {...styles.infoIndicator()}>
      <LucideInfo className={styles.infoIndicator2().className} />
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
      <span {...styles.folderToggle()}>{isOpen && hasChildren ? folderOpenIcon : folderIcon}</span>
      <span>{name}</span>
    </>
  )

  return (
    <div {...styles.folderToggle2()}>
      <div {...styles.folderToggle3()}>
        <div {...styles.folderToggle4()} style={rowStyle}>
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
          {comment && <span {...styles.folderToggle5()}>{comment}</span>}
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
