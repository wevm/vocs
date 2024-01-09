import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes, type ReactNode, useMemo } from 'react'

import { useCopyCode } from '../../hooks/useCopyCode.js'
import { CopyButton } from '../CopyButton.js'
import * as styles from './Pre.css.js'

export function Pre({
  children,
  ...props
}: DetailedHTMLProps<HTMLAttributes<HTMLPreElement>, HTMLPreElement>) {
  const { copied, copy, ref } = useCopyCode()

  function recurseChildren(children: ReactNode): ReactNode {
    if (!children) return children
    if (typeof children !== 'object') {
      if (typeof children === 'string') return children.replace('!!', '//')
      return children
    }
    if ('props' in children)
      return {
        ...children,
        props: {
          ...children.props,
          children: Array.isArray(children.props.children)
            ? children.props.children.map(recurseChildren)
            : recurseChildren(children.props.children),
        },
      }
    return children
  }
  const children_ = useMemo(() => recurseChildren(children), [children])

  return (
    <div className={clsx(styles.wrapper)}>
      <pre ref={ref} {...props} className={clsx(props.className, styles.root)}>
        {'data-language' in props && <CopyButton copied={copied} copy={copy} />}
        {children_}
      </pre>
    </div>
  )
}
