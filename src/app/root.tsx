import { type ReactNode } from 'react'
import { Helmet } from 'react-helmet'
import { Root as ConsumerRoot } from 'virtual:root'

import { ScrollRestoration } from 'react-router-dom'
import { FrontmatterHead } from './components/FrontmatterHead.js'
import { useApplyCssTransition } from './hooks/useApplyCssTransition.js'
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
  useApplyCssTransition()
  return (
    <>
      {head && <Helmet>{head}</Helmet>}
      {frontmatter && <FrontmatterHead frontmatter={frontmatter} />}
      {typeof window !== 'undefined' && <ScrollRestoration />}
      <ConsumerRoot frontmatter={frontmatter} path={path}>
        <div className="vocs">{children}</div>
      </ConsumerRoot>
    </>
  )
}
