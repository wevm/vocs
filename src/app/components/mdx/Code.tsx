import { clsx } from 'clsx'
import React, { type DetailedHTMLProps, type HTMLAttributes, type ReactElement, type JSXElementConstructor } from 'react'

import * as styles from './Code.css.js'

type CodeSpanProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  'data-line-number'?: number;
  children: ReactElement<any, string | JSXElementConstructor<any>>[];
}

export function Code(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  let children = filterEmptyLines(props.children);

  if (!Array.isArray(children)) {
    children = [children]
  }
  let lineNum = 1;
  children = Array.from(children).map(child => {
    if (React.isValidElement(child)) {
      let props = child.props;
      if (!props) {
        props = child.props = {};
      }

      (props as CodeSpanProps)['data-line-number'] = lineNum++;
      let spanChildren = (props as CodeSpanProps).children;
      if (!Array.isArray(spanChildren)) {
        spanChildren = [spanChildren];
      }
      (props as CodeSpanProps).children = [
        <span data-diff-flag></span>,
        ...spanChildren
      ]

      return React.cloneElement(child, props as CodeSpanProps);
    }
    return child;
  })

  return (
    <code {...props} className={clsx(props.className, styles.root)}>
      {children}
    </code>
  )
}

function filterEmptyLines(nodes: React.ReactNode) {
  if (!Array.isArray(nodes)) return nodes
  return nodes
    .map((child, index) =>
      child.props &&
        'data-line' in child.props &&
        typeof child.props.children === 'string' &&
        child.props.children.trim() === '' &&
        nodes[index + 1]?.props?.className?.includes('twoslash-tag-line')
        ? null
        : child,
    )
    .filter(Boolean)
}
