'use client'

import type { Meta, MetaFlat } from 'unhead/types'
import { unpackMeta } from 'unhead/utils'
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

  const resolved = resolveHead(config, pathname, frontmatter)
  const disabled = resolved === false
  const head = disabled ? {} : resolved
  const meta = head.meta ?? {}

  const baseTitle = frontmatter?.title ?? config.title
  const baseDescription = frontmatter?.description ?? config.description

  // String overrides cascade into downstream defaults (e.g. `description` feeds
  // `og:description`); `false` only omits the tag itself.
  const titleSource = typeof head.title === 'string' ? head.title : baseTitle
  const descriptionSource =
    typeof meta.description === 'string' ? meta.description : baseDescription

  const fullPathname = basePath && basePath !== '/' ? `${basePath}${pathname}` : pathname
  const canonicalDefault = baseUrl ? `${baseUrl}${fullPathname}` : undefined
  const canonicalSource = typeof head.canonical === 'string' ? head.canonical : canonicalDefault

  const fullTitle = (() => {
    if (head.title === false) return undefined
    // Explicit `title` bypasses `titleTemplate`.
    if (typeof head.title === 'string') return head.title
    const titleTemplate = resolveTitleTemplate(config, pathname, baseTitle, frontmatter)
    return titleTemplate ? titleTemplate.replace('%s', baseTitle) : baseTitle
  })()

  const ogImageTemplate = (() => {
    if (typeof ogImageUrl === 'function') return ogImageUrl(pathname, { baseUrl })
    if (typeof ogImageUrl === 'string') return ogImageUrl
    if (renderStrategy === 'full-static') return undefined
    return `${baseUrl ?? ''}/api/og?title=%title&description=%description`
  })()

  const ogImageDefault = ogImageTemplate
    ? ogImageTemplate
        .replace(
          '%logo',
          `${baseUrl ?? ''}${typeof logoUrl === 'string' ? logoUrl : (logoUrl?.dark ?? '')}`,
        )
        .replace('%title', encodeURIComponent(titleSource ?? ''))
        .replace('%description', encodeURIComponent(descriptionSource ?? ''))
    : undefined
  const ogImageSource = typeof meta.ogImage === 'string' ? meta.ogImage : ogImageDefault

  const tag = (value: string | false | undefined, fallback: string | undefined) => {
    if (value === false) return undefined
    return value ?? fallback
  }

  const base = tag(head.base, baseUrl)
  const canonical = tag(head.canonical, canonicalDefault)
  const icons = head.icons !== false

  const metaTags = unpackMeta(
    compactMeta({
      robots: frontmatter?.robots ?? (import.meta.env.PROD ? 'index, follow' : 'noindex, nofollow'),
      description: baseDescription,
      author: frontmatter?.author,
      ogType: 'website',
      ogTitle: titleSource,
      ogSiteName: config.title,
      ogUrl: baseUrl ? (canonicalSource ?? baseUrl) : undefined,
      ogDescription: descriptionSource,
      ogImage: ogImageDefault,
      articleAuthor: frontmatter?.author ? [frontmatter.author] : undefined,
      articleModifiedTime: frontmatter?.lastModified,
      twitterCard: 'summary_large_image',
      twitterTitle: titleSource,
      twitterDescription: descriptionSource,
      twitterImage: ogImageSource,
      ...meta,
    }) as MetaFlat,
  ) as Meta[]

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

      {!disabled && (
        <>
          {/* Title */}
          {fullTitle && <title key="title">{fullTitle}</title>}

          {/* Base URL */}
          {base && <base href={base} />}

          {/* Canonical */}
          {canonical && <link rel="canonical" href={canonical} />}

          {/* Icons */}
          {icons && iconUrl && typeof iconUrl === 'string' && (
            <link rel="icon" href={iconUrl} type={getIconType(iconUrl)} />
          )}
          {icons && iconUrl && typeof iconUrl !== 'string' && (
            <link rel="icon" href={iconUrl.light} type={getIconType(iconUrl.light)} />
          )}
          {icons && iconUrl && typeof iconUrl !== 'string' && (
            <link
              rel="icon"
              href={iconUrl.dark}
              type={getIconType(iconUrl.dark)}
              media="(prefers-color-scheme: dark)"
            />
          )}

          {/* Meta */}
          {metaTags.map((tag, index) => {
            const {
              charset: charSet,
              content,
              'http-equiv': httpEquiv,
              media,
              name,
              property,
            } = tag
            return (
              <meta
                key={`${name ?? property ?? httpEquiv ?? charSet}-${index}`}
                charSet={charSet}
                httpEquiv={httpEquiv}
                name={name}
                property={property}
                content={content != null ? String(content) : undefined}
                media={media}
              />
            )
          })}

          {/* Links */}
          {head.link?.map((tag, index) => (
            <link
              key={`${tag.rel}-${tag.href}-${index}`}
              {...(toReactProps(tag) as React.JSX.IntrinsicElements['link'])}
            />
          ))}

          {/* Scripts */}
          {head.script?.map((tag, index) => {
            const props = toReactProps(tag) as React.JSX.IntrinsicElements['script']
            const html = innerContent(tag)
            const key = `${tag.src ?? html}-${index}`
            if (html == null) return <script key={key} {...props} />
            return (
              <script
                key={key}
                {...props}
                // biome-ignore lint/security/noDangerouslySetInnerHtml: user-provided inline script from config
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )
          })}

          {/* Styles */}
          {head.style?.map((tag) => {
            const props = toReactProps(tag) as React.JSX.IntrinsicElements['style']
            const html = innerContent(tag)
            if (html == null) return null
            return (
              <style
                key={html}
                {...props}
                // biome-ignore lint/security/noDangerouslySetInnerHtml: user-provided inline style from config
                dangerouslySetInnerHTML={{ __html: html }}
              />
            )
          })}
        </>
      )}
    </>
  )
}

/** unhead types use HTML attribute casing; React needs camelCase for these. */
const reactPropName: Record<string, string> = {
  charset: 'charSet',
  crossorigin: 'crossOrigin',
  fetchpriority: 'fetchPriority',
  hreflang: 'hrefLang',
  'http-equiv': 'httpEquiv',
  imagesizes: 'imageSizes',
  imagesrcset: 'imageSrcSet',
  nomodule: 'noModule',
  referrerpolicy: 'referrerPolicy',
}

function toReactProps(tag: object) {
  const props: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(tag)) {
    if (key === 'innerHTML' || key === 'textContent') continue
    if (value == null || value === false) continue
    props[reactPropName[key] ?? key] = value
  }
  return props
}

function innerContent(tag: { innerHTML?: unknown; textContent?: unknown }) {
  const content = tag.innerHTML ?? tag.textContent
  if (content == null) return undefined
  return typeof content === 'string' ? content : JSON.stringify(content)
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

/**
 * Resolves the `head` config into per-tag overrides for the given route.
 * `false` (or a function returning `false`) disables every generated tag.
 */
export function resolveHead(
  config: Pick<Config.Config, 'head'>,
  path: string,
  frontmatter: Config.Frontmatter | undefined,
): Config.HeadTags | false {
  const head = typeof config.head === 'function' ? config.head(path, { frontmatter }) : config.head
  if (head === false) return false
  return head ?? {}
}

/** Drops disabled (`false`) and empty values before unpacking. */
function compactMeta(meta: Config.HeadMeta) {
  return Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== false && value != null && value !== ''),
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
