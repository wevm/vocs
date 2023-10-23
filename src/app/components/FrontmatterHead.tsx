import { Helmet } from 'react-helmet'
import type { Frontmatter } from '../types.js'

export function FrontmatterHead({ frontmatter }: { frontmatter: Frontmatter }) {
  const { title, description } = frontmatter
  return (
    <Helmet>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
    </Helmet>
  )
}
