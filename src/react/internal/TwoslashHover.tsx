import * as React from 'react'

import { TwoslashHover as TwoslashHover_client } from './TwoslashHover.client.js'

export function TwoslashHover(props: TwoslashHover.Props) {
  const { className = '', children } = props
  const [trigger, ...content] = React.Children.toArray(children)
  const open = className?.includes('twoslash-query-persisted')
  if (!content) return null
  return (
    <TwoslashHover_client className={className} open={open} trigger={trigger}>
      {content}
    </TwoslashHover_client>
  )
}

export declare namespace TwoslashHover {
  export type Props = React.PropsWithChildren<React.ComponentProps<'span'>>
}
