import { useEditLink } from '../hooks/useEditLink.js'
import * as styles from './Footer.css.js'

export function Footer() {
  const editLink = useEditLink()

  return (
    <footer className={styles.root}>
      <a className={styles.editLink} href={editLink.url} target="_blank" rel="noopener noreferrer">
        {editLink.text}
      </a>
    </footer>
  )
}
