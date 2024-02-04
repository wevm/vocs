import { clsx } from 'clsx'

import { Icon } from '../Icon.js'
import { File } from '../icons/File.js'
import { Terminal } from '../icons/Terminal.js'
import * as styles from './CodeTitle.css.js'

export function CodeTitle({
  children,
  className,
  language,
  ...props
}: { children: string; className?: string; language?: string }) {
  return (
    <div {...props} className={clsx(className, styles.root)}>
      {language === 'bash' ? (
        <Icon label="Terminal" size="14px" icon={Terminal} style={{ marginTop: 3 }} />
      ) : children.match(/\.(.*)$/) ? (
        <Icon label="File" size="14px" icon={File} style={{ marginTop: 1 }} />
      ) : null}
      {children}
    </div>
  )
}
