import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import { useCopyCode } from '../../hooks/useCopyCode.js'
import { CopyButton } from '../CopyButton.js'
import * as styles from './Pre.css.js'

export function Pre({
  children,
  ...props
}: DetailedHTMLProps<HTMLAttributes<HTMLPreElement>, HTMLPreElement>) {
  const { copied, copy, ref } = useCopyCode()

  return (
    <pre ref={ref} {...props} className={clsx(props.className, styles.root)}>
      {'data-language' in props && <CopyButton copied={copied} copy={copy} />}
      {children}
    </pre>
  )
}
