import { clsx } from 'clsx'

import { forwardRef } from 'react'
import * as styles from './ExternalLink.css.js'

export type ExternalLinkProps = React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>

export const ExternalLink = forwardRef(
  ({ className, children, href, ...props }: ExternalLinkProps, ref) => {
    return (
      <a
        ref={ref as any}
        className={clsx(className, styles.root)}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      >
        {children}
      </a>
    )
  },
)
