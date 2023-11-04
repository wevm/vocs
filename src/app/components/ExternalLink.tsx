import { clsx } from 'clsx'

import * as styles from './ExternalLink.css.js'

export type ExternalLinkProps = React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>

export function ExternalLink({ className, children, href, ...props }: ExternalLinkProps) {
  return (
    <a
      className={clsx(className, styles.root)}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  )
}
