import { clsx } from 'clsx'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

import * as styles from './Paragraph.css.js'

export function Paragraph(
  props: DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>,
) {
  return <p {...props} className={clsx(props.className, styles.root)} />
}
