import * as styles from './Content.css.js'

export function Content({ children }: { children: React.ReactNode }) {
  return (
    <article className={styles.root} data-pagefind-body>
      {children}
    </article>
  )
}
