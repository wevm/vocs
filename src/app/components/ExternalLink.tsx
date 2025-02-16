import { forwardRef } from 'react'

export type ExternalLinkProps = React.DetailedHTMLProps<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  HTMLAnchorElement
>

export const ExternalLink = forwardRef(
  ({ className, children, href, ...props }: ExternalLinkProps, ref) => {
    return (
      <a
        ref={ref as any}
        className={className}
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
