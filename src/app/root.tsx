import { type ReactNode } from 'react'
import { Helmet } from 'react-helmet'
import { ScrollRestoration } from 'react-router-dom'
import { Root as ConsumerRoot } from 'virtual:root'

import { useConfig } from './hooks/useConfig.js'
import { PageDataContext } from './hooks/usePageData.js'
import { type Module } from './types.js'

export function Root(props: {
  children: ReactNode
  filePath: string
  frontmatter: Module['frontmatter']
  path: string
}) {
  const { children, filePath, frontmatter, path } = props
  return (
    <>
      <Head frontmatter={frontmatter} />
      {typeof window !== 'undefined' && <ScrollRestoration />}
      <ConsumerRoot frontmatter={frontmatter} path={path}>
        <PageDataContext.Provider value={{ filePath, frontmatter }}>
          {children}
        </PageDataContext.Provider>
      </ConsumerRoot>
    </>
  )
}

function Head({ frontmatter }: { frontmatter: Module['frontmatter'] }) {
  const config = useConfig()

  const { baseUrl, font, iconUrl, logoUrl, ogImageUrl } = config
  const { title, description = config.description } = frontmatter || {}

  const enableTitleTemplate = config.title && config.title.toLowerCase() !== title?.toLowerCase()

  return (
    <>
      {/* Title */}
      <Helmet
        defaultTitle={config.title}
        titleTemplate={enableTitleTemplate ? config.titleTemplate : undefined}
      >
        {title && (
          <>
            <title>{title}</title>
            <meta property="og:title" content={title} />
          </>
        )}
      </Helmet>

      {/* Description */}
      {description && (
        <Helmet>
          <meta name="description" content={description} />
          <meta property="og:description" content={description} />
        </Helmet>
      )}

      {/* Icons */}
      {iconUrl && (
        <>
          {typeof iconUrl === 'string' ? (
            <Helmet>
              <link rel="icon" href={iconUrl} type={getIconType(iconUrl)} />
            </Helmet>
          ) : (
            <Helmet>
              <link rel="icon" href={iconUrl.light} type={getIconType(iconUrl.light)} />
              <link
                rel="icon"
                href={iconUrl.dark}
                type={getIconType(iconUrl.dark)}
                media="(prefers-color-scheme: dark)"
              />
            </Helmet>
          )}
        </>
      )}

      <Helmet>
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Base URL */}
      {baseUrl && (
        <Helmet>
          <base href={baseUrl} />
          <meta property="og:url" content={baseUrl} />
        </Helmet>
      )}

      {/* OG Image */}
      {ogImageUrl && (
        <Helmet>
          <meta
            property="og:image"
            content={ogImageUrl
              .replace(
                '%logo',
                `${baseUrl}${typeof logoUrl === 'string' ? logoUrl : logoUrl?.dark || ''}`,
              )
              .replace('%title', title || config.title || '')
              .replace('%description', description || '')}
          />
        </Helmet>
      )}

      {/* Fonts */}
      {font && (
        <>
          {font.google && (
            <Helmet>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
              <link
                href={`https://fonts.googleapis.com/css2?family=${font.google}:wght@300;400;500&display=swap`}
                rel="stylesheet"
              />
            </Helmet>
          )}
        </>
      )}
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
