import clsx from 'clsx'
import { useLocation } from 'react-router-dom'
import { visuallyHidden } from '../styles/utils.css.js'
import * as styles from './SkipLink.css.js'

export const skipLinkId = 'vocs-content'

export function SkipLink() {
  const { pathname } = useLocation()
  return (
    <a className={clsx(styles.root, visuallyHidden)} href={`${pathname}#${skipLinkId}`}>
      Skip to content
    </a>
  )
}
