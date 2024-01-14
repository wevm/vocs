import { clsx } from 'clsx'

import { forwardRef } from 'react'
import * as styles from './ExternalLink.css.js'

export type ExternalLinkProps = React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & { hideExternalIcon?: boolean }

export const ExternalLink = forwardRef(
  ({ className, children, hideExternalIcon, href, ...props }: ExternalLinkProps, ref) => {
    return (
      <a
        ref={ref as any}
        className={clsx(
          className,
          hideExternalIcon || typeof children !== 'string' ? undefined : styles.root,
        )}
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
