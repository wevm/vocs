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

  return releases.map((release) => ({
    ...release,
    bodyHtml: Markdown.toHtml(release.body),
  }))
}

export declare namespace fetchChangelog {
  type Options = {
    /** Maximum number of releases to fetch. @default 50 */
    limit?: number | undefined
    /** Include prereleases. @default false */
    prereleases?: boolean | undefined
  }
}
