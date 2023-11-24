import { type ReactNode } from 'react'
import { Helmet } from 'react-helmet'
import { ScrollRestoration } from 'react-router-dom'
import { Root as ConsumerRoot } from 'virtual:root'

import type { IconUrl } from '../config.js'
import { FrontmatterHead } from './components/FrontmatterHead.js'
import { useConfig } from './hooks/useConfig.js'
import type { Module } from './types.js'

export function Root({
  children,
  frontmatter,
  path,
}: {
  children: ReactNode
  frontmatter: Module['frontmatter']
  path: string
}) {
  return (
    <>
      <HelmetHead />
      {frontmatter && <FrontmatterHead frontmatter={frontmatter} />}
      {typeof window !== 'undefined' && <ScrollRestoration />}
      <ConsumerRoot frontmatter={frontmatter} path={path}>
        {children}
      </ConsumerRoot>
    </>
  )
}

function HelmetHead() {
  const config = useConfig()
  const { iconUrl } = config

  return <>{iconUrl && <IconTags iconUrl={iconUrl} />}</>
}

function IconTags({ iconUrl }: { iconUrl: IconUrl }) {
  if (typeof iconUrl === 'string')
    return (
      <Helmet>
        <link rel="icon" href={iconUrl} type={getIconType(iconUrl)} />
      </Helmet>
    )

  return (
    <Helmet>
      <link rel="icon" href={iconUrl.light} type={getIconType(iconUrl.light)} />
      <link
        rel="icon"
        href={iconUrl.dark}
        type={getIconType(iconUrl.dark)}
        media="(prefers-color-scheme: dark)"
      />
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
