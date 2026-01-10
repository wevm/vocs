'use client'

import { useRouter } from 'waku'
import * as MdxPageContext from './MdxPageContext.js'
import { useConfig } from './useConfig.js'

export function Head() {
  const config = useConfig()
  const { path: pathname } = useRouter()
  const { frontmatter } = MdxPageContext.use()

  const { basePath, baseUrl, iconUrl, logoUrl, ogImageUrl, renderStrategy } = config

  const title = frontmatter?.title ?? config.title
  const titleTemplate = title.includes(config.title) ? undefined : config.titleTemplate
  const fullTitle = titleTemplate ? titleTemplate.replace('%s', title) : title

  const description = frontmatter?.description ?? config.description

  const fullPathname = basePath && basePath !== '/' ? `${basePath}${pathname}` : pathname
  const canonicalUrl = baseUrl ? `${baseUrl}${fullPathname}` : undefined

  const ogImageTemplate = (() => {
    if (typeof ogImageUrl === 'function') return ogImageUrl(pathname)
    if (typeof ogImageUrl === 'string') return ogImageUrl
    if (renderStrategy === 'full-static') return undefined
    return `${baseUrl ?? ''}/api/og?title=%title&description=%description`
  })()

  const ogImage = ogImageTemplate
    ? ogImageTemplate
        .replace(
          '%logo',
          `${baseUrl ?? ''}${typeof logoUrl === 'string' ? logoUrl : (logoUrl?.dark ?? '')}`,
        )
        .replace('%title', encodeURIComponent(title ?? ''))
        .replace('%description', encodeURIComponent(description ?? ''))
    : undefined

  return (
    <>
      {/* Theme initialization (prevents FOUC) */}
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: blocking script to prevent FOUC
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('vocs-theme');if(t==='light'||t==='dark'){document.documentElement.style.colorScheme=t}else if(window.matchMedia('(prefers-color-scheme:dark)').matches){document.documentElement.style.colorScheme='dark'}else if(window.matchMedia('(prefers-color-scheme:light)').matches){document.documentElement.style.colorScheme='light'}}catch(e){}})()`,
        }}
      />

      {/* Title & Description */}
      {fullTitle && <title key="title">{fullTitle}</title>}
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
      {frontmatter?.author && <meta property="article:author" content={frontmatter.author} />}
      {frontmatter?.lastModified && (
        <meta property="article:modified_time" content={frontmatter.lastModified} />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta property="twitter:image" content={ogImage} />}
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
