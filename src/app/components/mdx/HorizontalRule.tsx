import { clsx } from 'clsx'
import type { DetailedHTMLProps, HTMLAttributes } from 'react'

import * as styles from './HorizontalRule.css.js'

export function HorizontalRule(
  props: DetailedHTMLProps<HTMLAttributes<HTMLHRElement>, HTMLHRElement>,
) {
  return <hr {...props} className={clsx(props.className, styles.root)} />
}
