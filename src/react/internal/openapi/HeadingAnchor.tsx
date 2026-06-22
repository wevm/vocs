import LucideLink from '~icons/lucide/link'

/**
 * A copy-link anchor appended to an OpenAPI heading. Reuses the markdown
 * `heading-anchor`/`heading-anchor-icon` classes so it inherits the same
 * hover-reveal and "copied" styling, and is handled by the global
 * `HeadingAnchors` client (which copies the anchor's URL on click).
 */
export function HeadingAnchor(props: HeadingAnchor.Props) {
  return (
    <a
      href={`#${props.id}`}
      className={`heading-anchor${props.className ? ` ${props.className}` : ''}`}
      aria-label="Copy link and go to this section"
      title="Copy link and go to this section"
    >
      <LucideLink className="heading-anchor-icon vocs:size-[0.75em]" />
    </a>
  )
}

export declare namespace HeadingAnchor {
  type Props = {
    id: string
    /** Extra classes appended to the anchor (e.g. to override the left margin). */
    className?: string | undefined
  }
}
