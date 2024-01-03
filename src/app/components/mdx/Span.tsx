import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import * as styles from './Span.css.js'
import { TwoslashPopover } from './TwoslashPopover.js'

export function Span(props: DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>) {
  const className = clsx(props.className, styles.root)

  if (props.className?.includes('twoslash-hover'))
    return <TwoslashPopover {...(props as any)} className={className} />
  return <span {...props} className={clsx(props.className, styles.root)} />
}
