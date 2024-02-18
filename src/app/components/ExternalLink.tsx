import { clsx } from 'clsx'

import { assignInlineVars } from '@vanilla-extract/dynamic'
import { forwardRef } from 'react'
import { useConfig } from '../hooks/useConfig.js'
import * as styles from './ExternalLink.css.js'

export type ExternalLinkProps = React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & { hideExternalIcon?: boolean }

export const ExternalLink = forwardRef(
  ({ className, children, hideExternalIcon, href, ...props }: ExternalLinkProps, ref) => {
    const { basePath } = useConfig()
    const assetBasePath = import.meta.env.PROD ? basePath : ''
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
        style={assignInlineVars({
          [styles.iconUrl]: `url(${assetBasePath}/.vocs/icons/arrow-diagonal.svg)`,
        })}
        {...props}
      >
        {children}
      </a>
    )
  },
)
