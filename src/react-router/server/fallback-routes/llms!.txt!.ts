// biome-ignore lint/suspicious/noExplicitAny: _
type TODO = any

export async function loader() {
  const build = await import('virtual:react-router/server-build')

  const title = 'TODO'
  const description = 'TODO'

  const content = [`# ${title}`, '', description ? description : '', '']

  for (const route of Object.values(build.routes)) {
    if (!route) continue

    const meta = (route?.module as TODO)?.meta?.() as TODO[]
    if (!meta) continue

    const title = meta.find((m: TODO) => 'title' in m)?.title
    if (!title) continue

    const description = meta.find((m: TODO) => m.name === 'description')?.content
    if (!description) continue

    content.push(`- [${title}](${`/${route.path ?? ''}`})${description ? `: ${description}` : ''}`)
  }

  return new Response(content.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
