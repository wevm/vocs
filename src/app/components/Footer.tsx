import { useEditLink } from '../hooks/useEditLink.js'
import { usePageData } from '../hooks/usePageData.js'
import * as styles from './Footer.css.js'

export function Footer() {
  const { frontmatter } = usePageData()
  const { layout } = frontmatter || {}

  const editLink = useEditLink()

  return (
    <footer className={styles.root}>
      {layout !== 'blog' && (
        <a
          className={styles.editLink}
          href={editLink.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          {editLink.text}
        </a>
      )}
    </footer>
  )
}
