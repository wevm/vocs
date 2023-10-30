import { Helmet } from 'react-helmet'
import { config } from 'virtual:config'

import type { Frontmatter } from '../types.js'

export function FrontmatterHead({ frontmatter }: { frontmatter: Frontmatter }) {
  const { title, description } = frontmatter

  const enableTitleTemplate = config.title && config.title !== title

  return (
    <Helmet
      defaultTitle={config.title}
      titleTemplate={enableTitleTemplate ? `%s – ${config.title}` : undefined}
    >
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
    </Helmet>
  )
}
