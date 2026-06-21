'use client'

import type { Payload } from '../internal/openapi/app.js'
import { OpenApiGuide, OpenApiPage } from '../react/internal/openapi/OpenApiPage.js'
import { Blocks } from './blocks.js'
import { join } from './links.js'
import { useRouter } from './waku.js'

/**
 * Resolves the active section route to real Vocs page content:
 *
 * - the spec landing/intro page,
 * - a single category page, or
 * - a consumer-authored guide page,
 *
 * each rendered by the genuine {@link file://../react/internal/openapi/OpenApiPage.tsx
 * `OpenApiPage`}/`OpenApiGuide` (which wrap the shared Vocs `Layout`). Matching
 * override pages replace the auto-generated header while the generated body
 * still renders below.
 */
export function App(props: App.Props) {
  const { payload } = props
  const { ir, pages } = payload
  const base = ir.path || '/'

  const { path: route } = useRouter()

  const page = pages.find((candidate) => join(base, candidate.path) === route)
  const intro = page ? <Blocks page={page} /> : undefined

  // Category page.
  const group = ir.groups.find((candidate) => join(base, `/${candidate.id}`) === route)
  if (group) return <OpenApiPage mount={base} group={group.id} intro={intro} title={page?.title} />

  // Landing / overview page.
  if (route === base || route === '/')
    return <OpenApiPage mount={base} intro={intro} title={page?.title} />

  // Standalone guide page.
  if (page)
    return (
      <OpenApiGuide title={page.title}>
        <Blocks page={page} />
      </OpenApiGuide>
    )

  return (
    <OpenApiGuide>
      <p>Not found.</p>
    </OpenApiGuide>
  )
}

export declare namespace App {
  type Props = {
    payload: Payload
  }
}
