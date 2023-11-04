import { clsx } from 'clsx'

import { Icon } from '../Icon.js'
import * as styles from './CodeTitle.css.js'

export function CodeTitle({
  children,
  className,
  ...props
}: { children: string; className?: string }) {
  const language = 'data-language' in props ? props['data-language'] : undefined
  return (
    <div {...props} className={clsx(className, styles.root)}>
      {language === 'bash' ? (
        <Icon
          label="Terminal"
          size="14px"
          src="/.vocs/icons/terminal.svg"
          style={{ marginTop: 3 }}
        />
      ) : children.match(/\.(.*)$/) ? (
        <Icon label="File" size="14px" src="/.vocs/icons/file.svg" style={{ marginTop: 1 }} />
      ) : null}
      {children}
    </div>
  )
}
