import { Link } from 'waku'
import LucideFileQuestion from '~icons/lucide/file-question'
import LucideHome from '~icons/lucide/home'
import { style, vars } from '../../styles/zyzz.config.js'

namespace styles {
  export const root = style({
    display: 'flex',
    minHeight: '60vh !custom',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: '6',
    paddingBlock: '16',
    textAlign: 'center',
  })

  export const iconContainer = style({
    marginBottom: '6',
    display: 'flex',
    width: '20',
    height: '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'calc(infinity * 1px) !custom',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    color: 'secondary',
  })

  export const icon = style({
    width: '10',
    height: '10',
  })

  export const title = style({
    marginBottom: '3',
    fontSize: 'h1',
    lineHeight: vars.layout.leadingH1,
    fontWeight: 'medium',
    letterSpacing: '-0.04em !custom',
    color: 'heading',
  })

  export const description = style({
    marginBottom: '8',
    maxWidth: 'md',
    lineHeight: vars.layout.leadingP,
    letterSpacing: 'normal',
    color: 'secondary',
  })

  export const homeLink = style({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    paddingInline: '5',
    paddingBlock: 'twoAndHalf',
    fontWeight: 'medium',
    color: 'heading',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: '150ms !custom',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          backgroundColor: 'surfaceMuted',
        },
      },
    },
  })

  export const homeIcon = style({
    width: '4',
    height: '4',
    color: 'secondary',
  })
}

export function NotFound() {
  return (
    <div {...styles.root()} data-v-not-found>
      <div {...styles.iconContainer()} data-v-not-found-icon>
        <LucideFileQuestion {...styles.icon()} />
      </div>

      <h1 {...styles.title()} data-v-not-found-title>
        Page not found
      </h1>

      <p {...styles.description()} data-v-not-found-description>
        The page you're looking for doesn't exist or has been moved.
      </p>

      <Link {...styles.homeLink()} data-v-not-found-link to="/">
        <LucideHome {...styles.homeIcon()} />
        Back to home
      </Link>
    </div>
  )
}

export declare namespace NotFound {
  export type Props = Record<string, never>
}
