import type * as Directive from './directive.js'

export type Adapter = {
  /** Adapter type identifier */
  type: string
  /** Fetches releases from the source */
  fetch: (options?: {
    /** Maximum number of releases to fetch */
    limit?: number | undefined
    /** Include prereleases */
    prereleases?: boolean | undefined
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
 * Strips a leading H1 from the release body when it duplicates the release title.
 *
 * GitHub renders the release name as the heading on the release page, so
 * authors often write a body that *also* begins with `# <title>`. When such a
 * release is shown in our changelog UI we already render the title above the
 * body, which produces a visible duplicate (see e.g. release authors writing
 * `# Release v1.6.0 — T3 …` while the GitHub release name is
 * `Release v1.6.0 - T3 …`). We compare the leading H1 text against the title
 * with loose normalization (lowercase, whitespace collapsing, all unicode
 * dashes treated as the same character) and strip it on match.
 */
export function stripDuplicateTitle(
  options: stripDuplicateTitle.Options,
): stripDuplicateTitle.ReturnType {
  const { body, title } = options
  if (!body || !title) return body
  const match = body.match(/^\s*#\s+(.+?)\s*(?:\r?\n|$)/)
  if (!match) return body
  if (normalizeTitle(match[1] ?? '') !== normalizeTitle(title)) return body
  return body.slice(match[0].length).replace(/^\s+/, '')
}

export declare namespace stripDuplicateTitle {
  type Options = {
    /** Release notes content (Markdown). */
    body: string
    /** Release title/name. */
    title: string
  }
  type ReturnType = string
}

/**
 * The built-in `::changelog` directive's markdown representation: releases
 * from the adapter, with `{limit=N}` handling and duplicate-title
 * normalization.
 */
export function directive(options: directive.Options): directive.ReturnType {
  const { adapter } = options
  return {
    name: 'changelog',
    async toMarkdown(attributes) {
      if (!adapter) return '<!-- changelog unavailable -->'

      // Malformed limits (NaN, zero, negative) fall back to the default.
      const parsed = Number.parseInt(attributes['limit'] ?? '', 10)
      const limit = Number.isInteger(parsed) && parsed > 0 ? parsed : 999

      const releases = await adapter.fetch({ limit, prereleases: false })
      return releases
        .map((release) => {
          const date = release.date.slice(0, 10)
          const body = stripDuplicateTitle({
            body: release.body,
            title: release.title,
          })
          const title =
            release.title && release.title !== release.version ? ` — ${release.title}` : ''
          return `## ${release.version}${title} (${date})\n\n${body}`.trim()
        })
        .join('\n\n')
    },
  }
}

export declare namespace directive {
  type Options = {
    /** Changelog adapter to fetch releases from (`config.changelog`). */
    adapter?: Adapter | undefined
  }
  type ReturnType = Directive.Directive
}

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[-\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
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
