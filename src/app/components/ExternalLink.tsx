import { clsx } from 'clsx'

import { assignInlineVars } from '@vanilla-extract/dynamic'
import { forwardRef } from 'react'
import { useConfig } from '../hooks/useConfig.js'
import { getSrcPrefixInDotVoc } from '../utils/rewriteConfig.js'
import * as styles from './ExternalLink.css.js'

export type ExternalLinkProps = React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & { hideExternalIcon?: boolean }

export const ExternalLink = forwardRef(
  ({ className, children, hideExternalIcon, href, ...props }: ExternalLinkProps, ref) => {
    const { baseUrl } = useConfig()
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
        style={{
          ...assignInlineVars({
            [styles.mask]: `url(${getSrcPrefixInDotVoc(
              baseUrl,
            )}/.vocs/icons/arrow-diagonal.svg) no-repeat center / contain`,
          }),
        }}
      >
        {children}
      </a>
    )
  },
)
