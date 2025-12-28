'use client'

import { Popover } from '@base-ui/react/popover'
import * as React from 'react'

export function TwoslashHover(props: TwoslashHover.Props) {
  const [content, trigger] = React.Children.toArray(props.children)
  return (
    <Popover.Root>
      <Popover.Trigger>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="start" side="bottom">
          <Popover.Popup initialFocus={false}>{content}</Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

export declare namespace TwoslashHover {
  export type Props = React.PropsWithChildren<React.ComponentProps<'span'>>
}
