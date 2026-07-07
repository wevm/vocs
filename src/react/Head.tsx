'use client'

import { useRouter } from 'waku'
import type * as Config from '../internal/config.js'
import * as MdxPageContext from './MdxPageContext.js'
import { useConfig } from './useConfig.js'

export function Head() {
  const config = useConfig()
  const { path: pathname } = useRouter()
  const { frontmatter } = MdxPageContext.use()

  const { basePath, baseUrl, colorScheme, iconUrl, logoUrl, ogImageUrl, renderStrategy } = config

  const staticScheme = colorScheme !== 'light dark'

  const title = frontmatter?.title ?? config.title
  const titleTemplate = resolveTitleTemplate(config, pathname, title, frontmatter)
  const fullTitle = titleTemplate ? titleTemplate.replace('%s', title) : title

  const description = frontmatter?.description ?? config.description
  const isHeadEnabled = (key: keyof Omit<Config.HeadOptions, 'meta'>) =>
    resolveHeadOption(config, key, pathname, frontmatter)
  const isMetaEnabled = (key: keyof NonNullable<Config.HeadOptions['meta']>) =>
    resolveMetaOption(config, key, pathname, frontmatter)

  const fullPathname = basePath && basePath !== '/' ? `${basePath}${pathname}` : pathname
  const canonicalUrl = baseUrl ? `${baseUrl}${fullPathname}` : undefined

  const ogImageTemplate = (() => {
    if (typeof ogImageUrl === 'function') return ogImageUrl(pathname, { baseUrl })
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
      {!staticScheme && (
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: blocking script to prevent FOUC
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var e=document.documentElement;var s=function(t){e.setAttribute('data-vocs-theme',t);e.style.colorScheme=t};var t=localStorage.getItem('vocs-theme');if(t==='light'||t==='dark'){s(t)}else if(window.matchMedia('(prefers-color-scheme:dark)').matches){s('dark')}else if(window.matchMedia('(prefers-color-scheme:light)').matches){s('light')}else{s('dark')}}catch(e){}})()`,
          }}
        />
      )}

      <meta name="color-scheme" content={colorScheme} />

      {/* Robots  */}
      {isHeadEnabled('robots') && (
        <meta
          name="robots"
          content={
            frontmatter?.robots ?? (import.meta.env.PROD ? 'index, follow' : 'noindex, nofollow')
          }
        />
      )}

      {/* Title & Description */}
      {fullTitle && isHeadEnabled('title') && <title key="title">{fullTitle}</title>}
      {description && isHeadEnabled('description') && (
        <meta name="description" content={description} />
      )}

      {/* Base URL */}
      {baseUrl && isHeadEnabled('base') && <base href={baseUrl} />}

      {/* Canonical */}
      {canonicalUrl && isHeadEnabled('canonical') && <link rel="canonical" href={canonicalUrl} />}

      {/* Icons */}
      {iconUrl && typeof iconUrl === 'string' && isHeadEnabled('icons') && (
        <link rel="icon" href={iconUrl} type={getIconType(iconUrl)} />
      )}
      {iconUrl && typeof iconUrl !== 'string' && isHeadEnabled('icons') && (
        <link rel="icon" href={iconUrl.light} type={getIconType(iconUrl.light)} />
      )}
      {iconUrl && typeof iconUrl !== 'string' && isHeadEnabled('icons') && (
        <link
          rel="icon"
          href={iconUrl.dark}
          type={getIconType(iconUrl.dark)}
          media="(prefers-color-scheme: dark)"
        />
      )}

      {/* Standard SEO */}
      {frontmatter?.author && isMetaEnabled('author') && (
        <meta name="author" content={frontmatter.author} />
      )}

      {/* Open Graph */}
      {isMetaEnabled('ogType') && <meta property="og:type" content="website" />}
      {title && isMetaEnabled('ogTitle') && <meta property="og:title" content={title} />}
      {config.title && isMetaEnabled('ogSiteName') && (
        <meta property="og:site_name" content={config.title} />
      )}
      {baseUrl && isMetaEnabled('ogUrl') && (
        <meta property="og:url" content={canonicalUrl ?? baseUrl} />
      )}
      {description && isMetaEnabled('ogDescription') && (
        <meta property="og:description" content={description} />
      )}
      {ogImage && isMetaEnabled('ogImage') && <meta property="og:image" content={ogImage} />}

      {/* Article metadata */}
      {frontmatter?.author && isMetaEnabled('articleAuthor') && (
        <meta property="article:author" content={frontmatter.author} />
      )}
      {frontmatter?.lastModified && isMetaEnabled('articleModifiedTime') && (
        <meta property="article:modified_time" content={frontmatter.lastModified} />
      )}

      {/* Twitter */}
      {isMetaEnabled('twitterCard') && <meta name="twitter:card" content="summary_large_image" />}
      {title && isMetaEnabled('twitterTitle') && <meta name="twitter:title" content={title} />}
      {description && isMetaEnabled('twitterDescription') && (
        <meta name="twitter:description" content={description} />
      )}
      {ogImage && isMetaEnabled('twitterImage') && (
        <meta property="twitter:image" content={ogImage} />
      )}
    </>
  )
}

export function resolveTitleTemplate(
  config: Pick<Config.Config, 'title' | 'titleTemplate'>,
  path: string,
  title: string | undefined,
  frontmatter: Config.Frontmatter | undefined,
) {
  const titleTemplate =
    typeof config.titleTemplate === 'function'
      ? config.titleTemplate(path, { frontmatter, siteTitle: config.title, title })
      : config.titleTemplate
  return title?.includes(config.title) ? undefined : titleTemplate
}

export function resolveHeadOption(
  config: Pick<Config.Config, 'head'>,
  key: keyof Omit<Config.HeadOptions, 'meta'>,
  path: string,
  frontmatter: Config.Frontmatter | undefined,
) {
  const option = config.head?.[key]
  if (typeof option === 'function') return option(path, { frontmatter })
  return option ?? true
}

export function resolveMetaOption(
  config: Pick<Config.Config, 'head'>,
  key: keyof NonNullable<Config.HeadOptions['meta']>,
  path: string,
  frontmatter: Config.Frontmatter | undefined,
) {
  const option = config.head?.meta?.[key]
  if (typeof option === 'function') return option(path, { frontmatter })
  return option ?? true
}

function getIconType(iconUrl: string) {
  if (iconUrl.endsWith('.svg')) return 'image/svg+xml'
  if (iconUrl.endsWith('.png')) return 'image/png'
  if (iconUrl.endsWith('.jpg')) return 'image/jpeg'
  if (iconUrl.endsWith('.ico')) return 'image/x-icon'
  if (iconUrl.endsWith('.webp')) return 'image/webp'
  return undefined
}
