import type * as Changelog from '../internal/changelog.js'
import * as Config from '../internal/config.js'
import * as Markdown from '../internal/markdown.js'

/**
 * Fetches changelog releases from the configured adapter.
 * For use in server components.
 *
 * @example
 * ```tsx
 * import { Actions } from 'vocs/server'
 *
 * export default async function ChangelogPage() {
 *   const releases = await Actions.fetchChangelog()
 *   return <Changelog releases={releases} />
 * }
 * ```
 */
export async function fetchChangelog(
  options: fetchChangelog.Options = {},
): Promise<Changelog.Release[]> {
  const config = await Config.resolve({ server: true })

  if (!config.changelog) {
    console.warn('[vocs] No changelog adapter configured in vocs.config.ts')
    return []
  }

  const releases = await config.changelog.fetch({
    limit: options.limit ?? 50,
    prereleases: options.prereleases ?? false,
  })

  return releases.map((release) => {
    const body = stripDuplicateTitle(release.body, release.title)
    return {
      ...release,
      body,
      bodyHtml: Markdown.toHtml(body),
    }
  })
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
function stripDuplicateTitle(body: string, title: string): string {
  if (!body || !title) return body
  const match = body.match(/^\s*#\s+(.+?)\s*(?:\r?\n|$)/)
  if (!match) return body
  if (normalizeTitle(match[1] ?? '') !== normalizeTitle(title)) return body
  return body.slice(match[0].length).replace(/^\s+/, '')
}

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/[-\u2010-\u2015\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

export declare namespace fetchChangelog {
  type Options = {
    /** Maximum number of releases to fetch. @default 50 */
    limit?: number | undefined
    /** Include prereleases. @default false */
    prereleases?: boolean | undefined
  }
}
