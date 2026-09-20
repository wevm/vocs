import { style } from 'zyzz/default'
import LucideLink from '~icons/lucide/link'
import { Link } from '../../Link.js'

namespace styles {
  export const headingAnchor = style({ width: '0.75em', height: '0.75em' })
}

/**
 * A copy-link anchor appended to an OpenAPI heading. Reuses the markdown
 * `heading-anchor`/`heading-anchor-icon` classes so it inherits the same
 * hover-reveal and "copied" styling, and is handled by the global
 * `HeadingAnchors` client (which copies the anchor's URL on click).
 */
export function HeadingAnchor(props: HeadingAnchor.Props) {
  return (
    <Link
      to={`#${props.id}`}
      className={`heading-anchor${props.className ? ` ${props.className}` : ''}`}
      aria-label="Copy link and go to this section"
      title="Copy link and go to this section"
    >
      <LucideLink
        className={styles.headingAnchor({ className: 'heading-anchor-icon' }).className}
      />
    </Link>
  )
}

export declare namespace HeadingAnchor {
  type Props = {
    id: string
    /** Extra classes appended to the anchor (e.g. to override the left margin). */
    className?: string | undefined
  }
}
