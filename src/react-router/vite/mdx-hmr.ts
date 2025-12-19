import type { PluginOption } from 'vite'

export function mdxHmr(): PluginOption {
  return {
    name: 'vocs:mdx-hmr',
    apply: 'serve',
    enforce: 'post',
    transform(code, id) {
      if (!id.endsWith('.mdx') && !id.endsWith('.md')) return
      if (!code.includes('validateRefreshBoundaryAndEnqueueUpdate')) return
      return {
        code: code.replace(
          /validateRefreshBoundaryAndEnqueueUpdate\(currentExports, nextExports, \[([^\]]+)\]\)/,
          'validateRefreshBoundaryAndEnqueueUpdate(currentExports, nextExports, [$1,"frontmatter"])',
        ),
        map: null,
      }
    },
  }
}
