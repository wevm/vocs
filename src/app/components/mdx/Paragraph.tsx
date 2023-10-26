import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './Paragraph.module.css'

export function Paragraph(
  props: DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>,
) {
  return <p {...props} className={clsx(props.className, styles.root)} />
}
