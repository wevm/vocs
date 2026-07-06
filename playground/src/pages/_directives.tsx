import type { Directive } from 'vocs'
import { Contributors, fetchContributors, parseLimit } from '../components/Contributors'
import { Counter } from '../components/Counter'

export default [
  {
    name: 'contributors',
    component: Contributors,
    async toMarkdown(attributes) {
      const contributors = await fetchContributors({
        limit: parseLimit(attributes['limit']),
        repo: attributes['repo'] ?? 'wevm/vocs',
      })
      return contributors
        .map((contributor) => `- [${contributor.login}](${contributor.html_url})`)
        .join('\n')
    },
  },
  {
    name: 'counter',
    component: Counter,
  },
] satisfies Directive[]
