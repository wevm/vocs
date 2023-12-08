import { Kbd } from './mdx/Kbd.js'

import * as styles from './KeyboardShortcut.css.js'

export function KeyboardShortcut(props: {
  description: string
  keys: string[]
}) {
  const { description, keys } = props
  return (
    <span className={styles.root}>
      {description}

      <span className={styles.kbdGroup}>
        {keys.map((key) => (
          <Kbd key={key}>{key}</Kbd>
        ))}
      </span>
    </span>
  )
}
