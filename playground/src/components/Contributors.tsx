export async function fetchContributors(options: { limit: number; repo: string }) {
  const { limit, repo } = options
  const token = process.env.GITHUB_TOKEN
  const response = await fetch(
    `https://api.github.com/repos/${repo}/contributors?per_page=${limit}`,
    { headers: token ? { authorization: `Bearer ${token}` } : {} },
  )
  if (!response.ok) throw new Error(`Failed to fetch contributors: ${response.status}`)
  return (await response.json()) as {
    avatar_url: string
    html_url: string
    login: string
  }[]
}

export function parseLimit(limit: string | null | undefined) {
  const parsed = Number.parseInt(limit ?? '', 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 30
}

export async function Contributors(props: Contributors.Props) {
  const contributors = await fetchContributors({
    limit: parseLimit(props.limit),
    repo: props.repo ?? 'wevm/vocs',
  }).catch(() => null)
  if (!contributors) return <p>Contributors unavailable.</p>

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {contributors.map((contributor) => (
        <a href={contributor.html_url} key={contributor.login} title={contributor.login}>
          <img
            alt={contributor.login}
            src={contributor.avatar_url}
            style={{ borderRadius: '50%', width: '48px', height: '48px' }}
          />
        </a>
      ))}
    </div>
  )
}

export declare namespace Contributors {
  export type Props = {
    limit?: string | null | undefined
    repo?: string | null | undefined
  }
}
