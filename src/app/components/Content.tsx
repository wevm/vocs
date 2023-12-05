import { type ClassValue, clsx } from 'clsx'

import * as styles from './Content.css.js'

export function Content({
  children,
  className,
}: { children: React.ReactNode; className?: ClassValue }) {
  return <article className={clsx(className, styles.root)}>{children}</article>
}
