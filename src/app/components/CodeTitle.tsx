import { clsx } from 'clsx'

import styles from './CodeTitle.module.css'
import { File } from './svgs/File.js'
import { Terminal } from './svgs/Terminal.js'

export function CodeTitle({
  children,
  className,
  ...props
}: { children: string; className?: string }) {
  const language = 'data-language' in props ? props['data-language'] : undefined
  return (
    <div {...props} className={clsx(className, styles.root)}>
      {language === 'bash' ? (
        <Terminal width={14} height={14} style={{ marginTop: 3 }} />
      ) : children.match(/\.(.*)$/) ? (
        <File width={14} height={14} style={{ marginTop: 1 }} />
      ) : null}
      {children}
    </div>
  )
}
