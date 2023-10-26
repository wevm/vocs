import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import { Footnotes } from '../Footnotes.js'
import styles from './Section.module.css'

export function Section(props: DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>) {
  if ('data-footnotes' in props)
    return <Footnotes {...props} className={clsx(props.className, styles.root)} />
  return <section {...props} className={clsx(props.className, styles.root)} />
}
