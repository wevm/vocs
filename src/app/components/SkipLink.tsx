import clsx from 'clsx'
import * as styles from './SkipLink.css.js'
import { visuallyHidden } from '../styles/utils.css.js'

export const skipLinkId = 'vocs-content'

export function SkipLink() {
  return (
    <a className={clsx(styles.root, visuallyHidden)} href={`#${skipLinkId}`}>
      Skip to content
    </a>
  )
}
