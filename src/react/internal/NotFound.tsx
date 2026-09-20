import { Link } from 'waku'
import { style, theme } from 'zyzz/default'
import LucideFileQuestion from '~icons/lucide/file-question'
import LucideHome from '~icons/lucide/home'

namespace styles {
  export const notFound = style({
    display: 'flex',
    minHeight: '60vh',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: 6,
    paddingBlock: 16,
    textAlign: 'center',
  })
  export const notFound2 = style({
    marginBottom: 6,
    display: 'flex',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'calc(infinity * 1px)',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    color: theme.vars.color.gray['900'],
  })
  export const notFound3 = style({ width: 10, height: 10 })
  export const notFound4 = style({
    marginBottom: 3,
    fontSize: '4xl',
    lineHeight: '1em',
    fontWeight: 'medium',
    letterSpacing: '-0.04em',
    color: theme.vars.color.foreground,
  })
  export const notFound5 = style({
    marginBottom: 8,
    maxWidth: '28rem',
    lineHeight: '1.625em',
    letterSpacing: '0em',
    color: theme.vars.color.gray['900'],
  })
  export const notFound6 = style({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 2,
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    paddingInline: 5,
    paddingBlock: 'calc(0.25rem * 2.5)',
    fontWeight: 'medium',
    color: theme.vars.color.foreground,
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: {
      '&:hover': { '@media (hover: hover)': { backgroundColor: theme.vars.color.gray['100'] } },
    },
  })
  export const notFound7 = style({
    width: 4,
    height: 4,
    color: theme.vars.color.gray['900'],
  })
}

export function NotFound() {
  return (
    <div {...styles.notFound()} data-v-not-found>
      <div {...styles.notFound2()} data-v-not-found-icon>
        <LucideFileQuestion className={styles.notFound3().className} />
      </div>

      <h1 {...styles.notFound4()} data-v-not-found-title>
        Page not found
      </h1>

      <p {...styles.notFound5()} data-v-not-found-description>
        The page you're looking for doesn't exist or has been moved.
      </p>

      <Link className={styles.notFound6().className} data-v-not-found-link to="/">
        <LucideHome className={styles.notFound7().className} />
        Back to home
      </Link>
    </div>
  )
}

export declare namespace NotFound {
  export type Props = Record<string, never>
}
