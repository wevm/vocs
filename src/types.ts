export type Frontmatter = {
  /** Title of the page. */
  title?: string | undefined
  /** Description of the page. */
  description?: string | undefined
  /** Additional metadata for the page. */
  [key: string]: unknown
}
