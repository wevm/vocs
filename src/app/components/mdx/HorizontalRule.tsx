import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import styles from './HorizontalRule.module.css'

export function HorizontalRule(
  props: DetailedHTMLProps<HTMLAttributes<HTMLHRElement>, HTMLHRElement>,
) {
  return <hr {...props} className={clsx(props.className, styles.root)} />
}
