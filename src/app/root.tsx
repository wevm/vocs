import { type ReactNode } from 'react'
import { Helmet } from 'react-helmet'
import { ScrollRestoration } from 'react-router-dom'
import { Root as ConsumerRoot } from 'virtual:root'

import { FrontmatterHead } from './components/FrontmatterHead.js'
import type { Module } from './types.js'

export function Root({
  children,
  head,
  frontmatter,
  path,
}: {
  children: ReactNode
  head: Module['head']
  frontmatter: Module['frontmatter']
  path: string
}) {
  return (
    <>
      {head && <Helmet>{head}</Helmet>}
      {frontmatter && <FrontmatterHead frontmatter={frontmatter} />}
      {typeof window !== 'undefined' && <ScrollRestoration />}
      <ConsumerRoot frontmatter={frontmatter} path={path}>
        {children}
      </ConsumerRoot>
    </>
  )
}
