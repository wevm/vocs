import { MDXProvider } from '@mdx-js/react'
import { type ReactNode, useEffect, useRef } from 'react'
import { Helmet } from 'react-helmet'
import { ScrollRestoration, useLocation } from 'react-router-dom'
import { Layout } from 'virtual:consumer-components'
import 'virtual:styles'

import { components } from './components/mdx/index.js'
import { useConfig } from './hooks/useConfig.js'
import { useOgImageUrl } from './hooks/useOgImageUrl.js'
import { PageDataContext } from './hooks/usePageData.js'
import { type Module } from './types.js'

export function Root(props: {
  children: ReactNode
  filePath?: string
  frontmatter: Module['frontmatter']
  lastUpdatedAt?: number
  path: string
}) {
  const { children, filePath, frontmatter, lastUpdatedAt, path } = props
  const { pathname } = useLocation()

  const previousPathRef = useRef<string>()
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    previousPathRef.current = pathname
  })

  return (
    <>
      <Head frontmatter={frontmatter} />
      {typeof window !== 'undefined' && <ScrollRestoration />}
      <MDXProvider components={components}>
        <Layout frontmatter={frontmatter} path={path}>
          <PageDataContext.Provider
            value={{ filePath, frontmatter, lastUpdatedAt, previousPath: previousPathRef.current }}
          >
            {children}
          </PageDataContext.Provider>
        </Layout>
      </MDXProvider>
    </>
  )
}

function Head({ frontmatter }: { frontmatter: Module['frontmatter'] }) {
  const config = useConfig()
  const ogImageUrl = useOgImageUrl()

  const { baseUrl, font, iconUrl, logoUrl } = config

  const title = frontmatter?.title ?? config.title
  const description = frontmatter?.description ?? config.description

  const enableTitleTemplate = config.title && !title.includes(config.title)

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'

  return (
    <Helmet
      defaultTitle={config.title}
      titleTemplate={enableTitleTemplate ? config.titleTemplate : undefined}
    >
      {/* Title */}
      {title && <title>{title}</title>}

      {/* Base URL */}
      {baseUrl && import.meta.env.PROD && !isLocalhost && <base href={baseUrl} />}

      {/* Description */}
      {description !== 'undefined' && <meta name="description" content={description} />}

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

      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title || config.title} />
      {baseUrl && <meta property="og:url" content={baseUrl} />}
      {description !== 'undefined' && <meta property="og:description" content={description} />}
      {ogImageUrl && (
        <meta
          property="og:image"
          content={ogImageUrl
            .replace(
              '%logo',
              `${baseUrl ? baseUrl : ''}${
                typeof logoUrl === 'string' ? logoUrl : logoUrl?.dark || ''
              }`,
            )
            .replace('%title', title || '')
            .replace('%description', (description !== 'undefined' ? description : '') || '')}
        />
      )}

      {/* Fonts */}
      {font?.google && <link rel="preconnect" href="https://fonts.googleapis.com" />}
      {font?.google && <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />}
      {font?.google && (
        <link
          href={`https://fonts.googleapis.com/css2?family=${font.google}:wght@300;400;500&display=swap`}
          rel="stylesheet"
        />
      )}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      {ogImageUrl && (
        <meta
          property="twitter:image"
          content={ogImageUrl
            .replace(
              '%logo',
              `${baseUrl ? baseUrl : ''}${
                typeof logoUrl === 'string' ? logoUrl : logoUrl?.dark || ''
              }`,
            )
            .replace('%title', title || '')
            .replace('%description', (description !== 'undefined' ? description : '') || '')}
        />
      )}
    </Helmet>
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
