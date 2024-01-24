import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes, type ReactNode, useMemo } from 'react'

import { useCopyCode } from '../../hooks/useCopyCode.js'
import { CopyButton } from '../CopyButton.js'
import { CodeBlock } from './CodeBlock.js'
import { CodeTitle } from './CodeTitle.js'
import * as styles from './Pre.css.js'

export function Pre({
  children,
  className,
  ...props
}: DetailedHTMLProps<HTMLAttributes<HTMLPreElement>, HTMLPreElement> & {
  'data-lang'?: string
  'data-title'?: string
}) {
  const { copied, copy, ref } = useCopyCode()

  function recurseChildren(children: ReactNode): ReactNode {
    if (!children) return children
    if (typeof children !== 'object') return children
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

  const wrap = (children: ReactNode) => {
    if (className?.includes('shiki'))
      return (
        <CodeBlock>
          {props['data-title'] && (
            <CodeTitle language={props['data-lang']}>{props['data-title']}</CodeTitle>
          )}
          {children}
        </CodeBlock>
      )
    return children
  }

  return wrap(
    <div className={clsx(styles.wrapper)}>
      <pre ref={ref} {...props} className={clsx(className, styles.root)}>
        {'data-language' in props && <CopyButton copied={copied} copy={copy} />}
        {children_}
      </pre>
    </div>,
  )
}
