'use client'

import { Popover } from '@base-ui/react/popover'

export function TwoslashCompletionList(props: TwoslashCompletionList.Props) {
  return (
    <Popover.Root open>
      <Popover.Trigger className="vocs:animate-blink" disabled tabIndex={-1}>
        |
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner align="start" collisionAvoidance={{ side: 'none' }} side="bottom">
          <Popover.Popup initialFocus={false}>{props.children}</Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}

export declare namespace TwoslashCompletionList {
  export type Props = React.PropsWithChildren<React.ComponentProps<'span'>>
}
