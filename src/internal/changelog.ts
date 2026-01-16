export type Adapter = {
  /** Adapter type identifier */
  type: string
  /** Fetches releases from the source */
  fetch: (options?: {
    /** Maximum number of releases to fetch */
    limit?: number | undefined
  }) => Promise<Release[]>
}

export type Release = {
  /** Release version/tag name (e.g., "v1.0.0") */
  version: string
  /** Release title/name */
  title: string
  /** Release date as ISO string */
  date: string
  /** Release notes content (Markdown) */
  body: string
  /** Release notes content as HTML (rendered from body) */
  bodyHtml?: string | undefined
  /** URL to the release page */
  url: string
  /** Whether this is a prerelease */
  prerelease?: boolean | undefined
}

/**
 * Creates a changelog adapter from a custom adapter definition.
 *
 * @example
 * ```ts
 * import { Changelog } from 'vocs'
 *
 * export default defineConfig({
 *   changelog: Changelog.from({
 *     type: 'custom',
 *     async fetch() {
 *       return [{ version: '1.0.0', title: 'v1.0.0', date: '2024-01-01', body: '', url: '' }]
 *     },
 *   }),
 * })
 * ```
 */
export function from(adapter: Adapter): Adapter {
  return adapter
}

/**
 * Creates a GitHub releases changelog adapter.
 *
 * @example
 * ```ts
 * import { github } from 'vocs/changelog'
 *
 * export default defineConfig({
 *   changelog: github({ repo: 'wevm/viem' }),
 * })
 * ```
 */
export function github(options: github.Options): Adapter {
  const { repo, token, prereleases = false } = options

  return {
    type: 'github',
    async fetch(fetchOptions = {}) {
      const { limit = 50 } = fetchOptions

      const apiToken = token || process.env['GITHUB_TOKEN']
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'vocs-changelog',
      }
      if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`

      const response = await globalThis.fetch(
        `https://api.github.com/repos/${repo}/releases?per_page=${limit}`,
        { headers },
      )

      if (!response.ok) throw new Error(`Failed to fetch GitHub releases: ${response.statusText}`)

      type GitHubRelease = {
        tag_name: string
        name: string | null
        published_at: string
        body: string | null
        html_url: string
        prerelease: boolean
        draft: boolean
      }
      const data = (await response.json()) as GitHubRelease[]

      return data
        .filter((release) => prereleases || !release.prerelease)
        .map((release) => ({
          version: release.tag_name,
          title: release.name || release.tag_name,
          date: release.published_at,
          body: release.body || '',
          url: release.html_url,
          prerelease: release.prerelease,
        }))
    },
  }
}

export declare namespace github {
  type Options = {
    /**
     * GitHub repository in "owner/repo" format.
     * @example "wevm/viem"
     */
    repo: string
    /**
     * Include prereleases in the changelog.
     * @default false
     */
    prereleases?: boolean | undefined
    /**
     * GitHub API token for authenticated requests (higher rate limits).
     * Falls back to GITHUB_TOKEN environment variable.
     */
    token?: string | undefined
  }
}
