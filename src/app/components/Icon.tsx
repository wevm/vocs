import { assignInlineVars } from '@vanilla-extract/dynamic'

import clsx from 'clsx'
import * as styles from './Icon.css.js'

export type IconProps = {
  className?: string
  label: string
  size?: string
  src: string
  style?: React.CSSProperties
}

export function Icon({ className, label, size = '1em', src, style }: IconProps) {
  return (
    <div
      aria-label={label}
      className={clsx(styles.root, className)}
      role="img"
      style={{
        ...style,
        ...assignInlineVars({ [styles.sizeVar]: size, [styles.srcVar]: `url(${src})` }),
      }}
    />
  )
}
