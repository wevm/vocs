import { assignInlineVars } from '@vanilla-extract/dynamic'

import * as styles from './Icon.css.js'

export type IconProps = {
  label: string
  size?: string
  src: string
  style?: React.CSSProperties
}

export function Icon({ label, size = '1em', src, style }: IconProps) {
  return (
    <div
      aria-label={label}
      className={styles.root}
      role="img"
      style={{
        ...style,
        ...assignInlineVars({ [styles.sizeVar]: size, [styles.srcVar]: `url(${src})` }),
      }}
    />
  )
}
