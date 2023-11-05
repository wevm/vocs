import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import { root, slugTarget } from './Heading.css.js'

export function Heading({
  level,
  ...props
}: DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement> & {
  level: 1 | 2 | 3 | 4 | 5 | 6
}) {
  const Component = `h${level}` as any
  return (
    <Component {...props} id={undefined} className={clsx(props.className, root)}>
      <div id={props.id} className={slugTarget} />
      {props.children}
    </Component>
  )
}
