import type * as HAst from 'hast'
import { type Components, toJsxRuntime } from 'hast-util-to-jsx-runtime'
import { createElement, Fragment } from 'react'
import { jsx, jsxs } from 'react/jsx-runtime'
import { useMDXComponents } from '../../mdx.js'

/**
 * Renders code block contents from hast. React development builds keep debug
 * info per JSX call site, so one shared call site keeps code-heavy pages cheap.
 */
export function CodeTree(props: CodeTree.Props) {
  return toJsxRuntime(props.tree, {
    Fragment,
    jsx,
    jsxs,
    components: {
      ...(useMDXComponents() as Partial<Components>),
      // Static subtrees serialized by `rehypeStaticCode`.
      'vocs-static-html': StaticHtml as never,
    },
  })
}

function StaticHtml(props: { tag: string; html: string }) {
  const { tag, html, ...rest } = props
  return createElement(tag, { ...rest, dangerouslySetInnerHTML: { __html: html } })
}

export declare namespace CodeTree {
  type Props = { tree: HAst.Root }
}
