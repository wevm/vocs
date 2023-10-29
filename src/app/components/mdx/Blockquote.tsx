import { clsx } from 'clsx'
import { type BlockquoteHTMLAttributes, type DetailedHTMLProps } from 'react'

import * as styles from './Blockquote.css.js'

export function Blockquote(
  props: DetailedHTMLProps<BlockquoteHTMLAttributes<HTMLQuoteElement>, HTMLQuoteElement>,
) {
  return <blockquote {...props} className={clsx(props.className, styles.root)} />
}
