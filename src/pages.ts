export type Page = {
  name: string
  default: () => JSX.Element
  head: () => JSX.Element
  path: string
}

export function pages() {
  const pages = import.meta.glob<true, string, Page>('./pages/*.tsx', {
    eager: true,
  })
  const pathRegex = new RegExp('./pages/*.tsx'.replace(/\*/g, '(.*)'))

  return Object.keys(pages).map((path) => {
    const name = path.match(pathRegex)?.[1]
    if (!name) throw new Error(`Invalid path: ${path}`)
    const page = pages[path]
    return {
      name,
      component: page.default,
      head: page.head || (() => null),
      path: name === 'index' ? '/' : `/${name.toLowerCase()}`,
    }
  })
}
