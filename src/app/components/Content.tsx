import styles from './Content.module.css'

export function Content({ children }: { children: React.ReactNode }) {
  return <article className={`vocs ${styles.root}`}>{children}</article>
}
