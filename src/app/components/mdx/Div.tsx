import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import { CodeGroup } from '../CodeGroup.js'
import { CodeTitle } from '../CodeTitle.js'

export function Div(props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
  if (props.className === 'code-group') return <CodeGroup {...(props as any)} />
  if ('data-rehype-pretty-code-title' in props) return <CodeTitle {...(props as any)} />
  return <div {...props} />
}
