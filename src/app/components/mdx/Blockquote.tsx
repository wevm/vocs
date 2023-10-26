import { clsx } from 'clsx'
import { type BlockquoteHTMLAttributes, type DetailedHTMLProps } from 'react'

import styles from './Blockquote.module.css'

export function Blockquote(
  props: DetailedHTMLProps<BlockquoteHTMLAttributes<HTMLQuoteElement>, HTMLQuoteElement>,
) {
  return <blockquote {...props} className={clsx(props.className, styles.root)} />
}
