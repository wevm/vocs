export function getMarkdownAssetPath(path: string) {
  const pagePath = path === '/' ? '/index' : path.replace(/\/$/, '')
  return `/assets/md${pagePath}.md`
}
