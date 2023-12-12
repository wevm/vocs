import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import { CodeTitle } from './CodeTitle.js'
import * as styles from './Figcaption.css.js'

export function Figcaption(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  const className = clsx(props.className, styles.root)

  if ('data-rehype-pretty-code-title' in props)
    return <CodeTitle {...(props as any)} className={className} />
  return <figcaption {...props} className={className} />
}
