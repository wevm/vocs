export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export function padStartSlash(path: string, replaceSlash = true) {
  const p = replaceSlash ? slash(path) : path
  return p.startsWith('/') ? p : `/${p}`
}
