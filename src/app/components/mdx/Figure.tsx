import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import { CodeBlock } from './CodeBlock.js'
import * as styles from './Figure.css.js'

export function Figure(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  const className = clsx(props.className, styles.root)

  if ('data-rehype-pretty-code-figure' in props)
    return <CodeBlock {...(props as any)} className={className} />
  return <figure {...props} className={className} />
}
