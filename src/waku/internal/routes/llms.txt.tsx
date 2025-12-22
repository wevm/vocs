import type { Frontmatter } from '../../../types.js'

export const GET = async () => {
  const { config } = await import('virtual:vocs/config')
  const { pages } = await import('virtual:vocs/pages?contentType=html-minimal')

  const { title, description } = config

  const content = [`# ${title}`, '', description ? description : '', '']

  type PageModule = {
    frontmatter?: Frontmatter
  }
  const routeData = await Promise.all(
    Object.entries(pages as Record<string, () => Promise<PageModule>>).map(
      async ([file, importFn]) => {
        if (!importFn) return null
        if (file.endsWith('.txt.tsx') || file.endsWith('.txt.ts')) return null

        try {
          const mod = await importFn()
          const frontmatter = mod?.frontmatter

          const title = frontmatter?.title
          const description = frontmatter?.description

          if (!title) return null

          const path = file
            .replace(/^\.\//, '')
            .replace(/\.\w+$/, '')
            .replace(/\/index$/, '')
            .replace(/^index$/, '')

          return {
            title,
            description,
            path: path ? `/${path}` : '/',
          }
        } catch {
          return null
        }
      },
    ),
  )
    .then((data) => data.filter((data): data is NonNullable<typeof data> => data !== null))
    .then((data) =>
      data.sort((a, b) => {
        const depthA = a.path.split('/').filter(Boolean).length
        const depthB = b.path.split('/').filter(Boolean).length
        if (depthA !== depthB) return depthA - depthB
        return a.path.localeCompare(b.path)
      }),
    )

  for (const data of routeData)
    content.push(
      `- [${data.title}](${data.path})${data.description ? `: ${data.description}` : ''}`,
    )

  return new Response(content.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

export const getConfig = async () => {
  return {
    render: 'static',
  } as const
}
