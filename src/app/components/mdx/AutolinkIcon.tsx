import { clsx } from 'clsx'
import { type DetailedHTMLProps, type ImgHTMLAttributes } from 'react'

import * as styles from './AutolinkIcon.css.js'

export function AutolinkIcon(
  props: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
) {
  return <div {...props} className={clsx(props.className, styles.root)} />
}
