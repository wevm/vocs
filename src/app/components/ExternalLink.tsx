import { clsx } from 'clsx'

import { forwardRef } from 'react'
import * as styles from './ExternalLink.css.js'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import { getUrlWithBase } from '../utils/getUrlWithBase.js'
import { useConfig } from '../hooks/useConfig.js'

export type ExternalLinkProps = React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
> & { hideExternalIcon?: boolean }

export const ExternalLink = forwardRef(
  ({ className, children, hideExternalIcon, href, ...props }: ExternalLinkProps, ref) => {
    const { baseUrl, vite } = useConfig();
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
        style={assignInlineVars({
          [styles.maskVar]: `url(${getUrlWithBase('/.vocs/icons/arrow-diagonal.svg', baseUrl)}) no-repeat center / contain`
        })}
      >
        {children}
      </a>
    )
  },
)
