import { Helmet } from 'react-helmet'

import { useConfig } from '../hooks/useConfig.js'
import type { Frontmatter } from '../types.js'

export function FrontmatterHead({ frontmatter }: { frontmatter: Frontmatter }) {
  const { title, description } = frontmatter

  const config = useConfig()

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
