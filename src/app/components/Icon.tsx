import { assignInlineVars } from '@vanilla-extract/dynamic'

import clsx from 'clsx'
import * as styles from './Icon.css.js'

export type IconProps = {
  className?: string
  label: string
  icon: React.ElementType
  size?: string
  style?: React.CSSProperties
}

export function Icon({ className, label, icon: Icon, size, style }: IconProps) {
  return (
    <div
      aria-label={label}
      className={clsx(styles.root, className)}
      role="img"
      style={{
        ...style,
        ...assignInlineVars({ [styles.sizeVar]: size }),
      }}
    >
      <Icon height={size} width={size} />
    </div>
  )
}
