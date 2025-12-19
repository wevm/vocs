import '../globals.d.ts'
import { config } from 'virtual:vocs/config'
import { useLocation, useMatches } from 'react-router'
import type { Frontmatter } from '../types.js'

export function VocsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head />
      {children}
    </>
  )
}

export type LoaderData = {
  content?: string | undefined
  editUrl?: string | undefined
  frontmatter?: Frontmatter | undefined
  lastModified?: string | undefined
}

function Head() {
  const { baseUrl, iconUrl, logoUrl, ogImageUrl } = config

  const { pathname } = useLocation()
  const matches = useMatches()
  const match = matches.find((match) => match.pathname === pathname)
  const data = match?.data as LoaderData | undefined
  const { frontmatter, editUrl, lastModified } = data ?? {}

  const title = frontmatter?.title ?? config.title
  const titleTemplate = title.includes(config.title) ? undefined : config.titleTemplate
  const fullTitle = titleTemplate ? titleTemplate.replace('%s', title) : title

  const description = frontmatter?.description ?? config.description

  const canonicalUrl = baseUrl ? `${baseUrl}${pathname}` : undefined

  const resolvedOgImageUrl = (() => {
    if (!ogImageUrl) return undefined
    if (typeof ogImageUrl === 'string') return ogImageUrl
    if (pathname && ogImageUrl[pathname]) return ogImageUrl[pathname]
    return ogImageUrl['/'] ?? Object.values(ogImageUrl)[0]
  })()

  const ogImage = resolvedOgImageUrl
    ?.replace(
      '%logo',
      `${baseUrl ?? ''}${typeof logoUrl === 'string' ? logoUrl : (logoUrl?.dark ?? '')}`,
    )
    .replace('%title', title ?? '')
    .replace('%description', description ?? '')

  const twitterImage = resolvedOgImageUrl
    ?.replace(
      '%logo',
      `${baseUrl ?? ''}${typeof logoUrl === 'string' ? logoUrl : (logoUrl?.dark ?? '')}`,
    )
    .replace('%title', title ? encodeURIComponent(title) : '')
    .replace('%description', description ? encodeURIComponent(description) : '')

  return (
    <>
      {/* Title & Description */}
      {fullTitle && <title>{fullTitle}</title>}
      {description && <meta name="description" content={description} />}

      {/* Base URL */}
      {baseUrl && <base href={baseUrl} />}

      {/* Canonical */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      {/* Icons */}
      {iconUrl && typeof iconUrl === 'string' && (
        <link rel="icon" href={iconUrl} type={getIconType(iconUrl)} />
      )}
      {iconUrl && typeof iconUrl !== 'string' && (
        <link rel="icon" href={iconUrl.light} type={getIconType(iconUrl.light)} />
      )}
      {iconUrl && typeof iconUrl !== 'string' && (
        <link
          rel="icon"
          href={iconUrl.dark}
          type={getIconType(iconUrl.dark)}
          media="(prefers-color-scheme: dark)"
        />
      )}

      {/* Standard SEO */}
      {frontmatter?.author && <meta name="author" content={frontmatter.author} />}
      {frontmatter?.robots && <meta name="robots" content={frontmatter.robots} />}

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      {title && <meta property="og:title" content={title} />}
      {config.title && <meta property="og:site_name" content={config.title} />}
      {baseUrl && <meta property="og:url" content={canonicalUrl ?? baseUrl} />}
      {description && <meta property="og:description" content={description} />}
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Article metadata */}
      {editUrl && <meta name="article:edit_url" content={editUrl} />}
      {lastModified && <meta property="article:modified_time" content={lastModified} />}
      {frontmatter?.author && <meta property="article:author" content={frontmatter.author} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      {twitterImage && <meta property="twitter:image" content={twitterImage} />}
    </>
  )
}

function getIconType(iconUrl: string) {
  if (iconUrl.endsWith('.svg')) return 'image/svg+xml'
  if (iconUrl.endsWith('.png')) return 'image/png'
  if (iconUrl.endsWith('.jpg')) return 'image/jpeg'
  if (iconUrl.endsWith('.ico')) return 'image/x-icon'
  if (iconUrl.endsWith('.webp')) return 'image/webp'
  return undefined
}
