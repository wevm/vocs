export async function loader(): Promise<Response> {
  const build = await import('virtual:react-router/server-build')

  const title = 'TODO'
  const description = 'TODO'

  const content = [`# ${title}`, '', description ? description : '', '']

  const routes = Object.values(build.routes).filter(
    (route) => route?.module?.loader && !route.id?.includes('llms'),
  )

  const results = await Promise.all(
    routes.map(async (route) => {
      if (!route) return null
      try {
        const result = (await route.module?.loader?.({
          content: true,
        } as never)) as { content: string | null }
        return result?.content ?? null
      } catch {
        return null
      }
    }),
  )

  content.push(results.filter(Boolean).join('\n\n'))

  return new Response(content.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
