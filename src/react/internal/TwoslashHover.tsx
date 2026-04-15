import * as React from 'react'

import { TwoslashHover as TwoslashHover_client } from './TwoslashHover.client.js'

export function TwoslashHover(props: TwoslashHover.Props) {
  const {
    className = '',
    children,
    'data-v-twoslash-code-html': codeHtml,
    'data-v-twoslash-docs-html': docsHtml,
  } = props
  const [trigger, ...content] = React.Children.toArray(children)
  const open = className?.includes('twoslash-query-persisted')
  if (!trigger) return null

  const popupChildren = codeHtml || docsHtml ? undefined : content

  return (
    <TwoslashHover_client
      className={className}
      codeHtml={codeHtml}
      docsHtml={docsHtml}
      open={open}
      trigger={trigger}
    >
      {popupChildren}
    </TwoslashHover_client>
  )
}

export declare namespace TwoslashHover {
  export type Props = React.PropsWithChildren<
    React.ComponentProps<'span'> & {
      'data-v-twoslash-code-html'?: string | undefined
      'data-v-twoslash-docs-html'?: string | undefined
    }
  >
}
