// biome-ignore lint/suspicious/noExplicitAny: _
type TODO = any

export async function loader(): Promise<Response> {
  const build = await import('virtual:react-router/server-build')

  const title = 'TODO'
  const description = 'TODO'

  const content = [`# ${title}`, '', description ? description : '', '']

  const routeData = await Promise.all(
    Object.values(build.routes).map(async (route) => {
      if (!route) return null
      if (route.path?.endsWith('.txt')) return null

      const loader = (route?.module as TODO)?.loader
      if (!loader) return null

      try {
        const { frontmatter } = await loader()

        const title = frontmatter?.title ?? 'TODO'
        const description = frontmatter?.description ?? 'TODO'

        return {
          title,
          description,
          path: route.path ?? '',
        }
      } catch {
        return null
      }
    }),
  )

  for (const data of routeData) {
    if (!data) continue
    content.push(
      `- [${data.title}](${`/${data.path}`})${data.description ? `: ${data.description}` : ''}`,
    )
  }

  return new Response(content.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
