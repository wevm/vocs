import * as Path from '../../internal/path.js'

export function getMarkdownAssetPath(path: string, basePath?: string) {
  const pagePath = path === '/' ? '/index' : path.replace(/\/$/, '')
  return Path.withBasePath(`/assets/md${pagePath}.md`, basePath)
}
