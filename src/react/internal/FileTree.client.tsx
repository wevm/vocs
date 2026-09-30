'use client'

import { Popover } from '@base-ui/react/popover'
import * as React from 'react'
import { cx } from 'zyzz'
import LucideInfo from '~icons/lucide/info'
import { style, vars } from '../../styles/zyzz.config.js'

namespace styles {
  export const tooltipTrigger = style({
    marginInline: `calc(${vars.spacing.unit} * -2) !custom`,
    marginBlock: `calc(${vars.spacing.unit} * -0.5) !custom`,
    display: 'flex',
    alignItems: 'center',
    gap: '2',
    justifySelf: 'flex-start',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'transparent !custom',
    paddingInline: '2',
    paddingBlock: 'half',
    whiteSpace: 'nowrap',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: 'standard',
    selectors: {
      '&[data-highlighted="true"]': {
        borderColor: 'primary',
        backgroundColor: 'surfaceTint',
      },
    },
  })

  export const infoTrigger = style({
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          borderColor: 'primary',
          backgroundColor: 'surfaceTint',
        },
      },
      '&[data-popup-open]': {
        borderColor: 'primary',
        backgroundColor: 'surfaceTint',
      },
    },
  })

  export const folderButton = style({
    margin: '0',
    backgroundColor: 'transparent !custom',
    selectors: {
      '&:not(*:disabled)': {
        cursor: 'pointer',
      },
    },
  })

  export const tooltipPopup = style({
    zIndex: 50,
    maxWidth: '300px !custom',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    paddingInline: '3',
    paddingBlock: '2',
    fontFamily: 'sans',
    fontSize: 'sm',
    lineHeight: 'sm',
    color: 'primary',
    boxShadow:
      '0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  })

  export const infoIndicator = style({
    display: 'flex',
    width: '4',
    height: '4',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    color: 'muted',
  })

  export const infoIcon = style({
    width: 'threeAndHalf',
    height: 'threeAndHalf',
  })

  export const folderToggle = style({
    flexShrink: 0,
  })

  export const folderRow = style({
    display: 'flex',
    flexDirection: 'column',
    overflow: 'visible',
  })

  export const folderGuide = style({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    paddingBlock: '1',
  })

  export const folderLabel = style({
    display: 'grid',
    width: 'fit-content !custom',
    alignItems: 'center',
    columnGap: '4',
    color: 'primary',
  })

  export const folderName = style({
    whiteSpace: 'nowrap',
    color: 'muted',
  })
}

function InfoIndicator() {
  return (
    <span aria-hidden="true" {...styles.infoIndicator()}>
      <LucideInfo {...styles.infoIcon()} />
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
        {...cx(styles.tooltipTrigger(), styles.infoTrigger())}
      >
        {children}
        <InfoIndicator />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="top" align="center" sideOffset={6}>
          <Popover.Popup {...styles.tooltipPopup()}>{content}</Popover.Popup>
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
    <div {...styles.folderRow()}>
      <div {...styles.folderGuide()}>
        <div {...styles.folderLabel()} style={rowStyle}>
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
                {...cx(styles.tooltipTrigger(), styles.folderButton(), styles.infoTrigger())}
              >
                {folderInner}
                <InfoIndicator />
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner side="top" align="center" sideOffset={6}>
                  <Popover.Popup {...styles.tooltipPopup()}>{tooltip}</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          ) : (
            <button
              {...cx(styles.tooltipTrigger(), styles.folderButton())}
              data-highlighted={highlighted}
              data-open={isOpen}
              disabled={!hasChildren}
              onClick={() => setIsOpen(!isOpen)}
              type="button"
            >
              {folderInner}
            </button>
          )}
          {comment && <span {...styles.folderName()}>{comment}</span>}
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
