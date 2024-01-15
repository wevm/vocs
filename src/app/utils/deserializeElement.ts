import React, { type ReactElement, type ReactNode } from 'react'

export function deserializeElement(element: ReactElement, key?: number): ReactNode {
  if (typeof element !== 'object') return element
  if (element === null) return element
  if (Array.isArray(element)) return element.map<any>((el, i) => deserializeElement(el, i))

  const props: any = element.props.children
    ? { ...element.props, children: deserializeElement(element.props.children) }
    : element.props
  return React.createElement(element.type, { ...props, key })
}
