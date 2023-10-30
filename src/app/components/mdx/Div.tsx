import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import { CodeBlock } from './CodeBlock.js'
import { CodeGroup } from './CodeGroup.js'
import { CodeTitle } from './CodeTitle.js'
import * as styles from './Div.css.js'
import { Subtitle } from './Subtitle.js'
import { Steps } from './Steps.js'

export function Div(props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
  const className = clsx(props.className, styles.root)
  if (props.className === 'code-group')
    return <CodeGroup {...(props as any)} className={className} />
  if ('data-rehype-pretty-code-title' in props)
    return <CodeTitle {...(props as any)} className={className} />
  if ('data-rehype-pretty-code-fragment' in props)
    return <CodeBlock {...(props as any)} className={className} />
  if ('data-vocs-steps' in props) return <Steps {...(props as any)} className={className} />
  if (props.role === 'doc-subtitle') return <Subtitle {...(props as any)} />
  return <div {...props} className={className} />
}
