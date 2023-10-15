import { Helmet } from 'react-helmet'
import type { Frontmatter } from '../types.js'

export function FrontmatterHead({ frontmatter }: { frontmatter: Frontmatter }) {
  const { title } = frontmatter
  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  )
}
