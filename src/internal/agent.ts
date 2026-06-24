/**
 * Builds the `/.well-known/agent.json` discovery manifest.
 *
 * The manifest gives AI agents a single, predictable entrypoint that ties
 * together the machine-readable surfaces Vocs already emits (`llms.txt`,
 * `llms-full.txt`, `sitemap.xml`) alongside basic site metadata. Agents can
 * fetch one well-known file to discover where the full docs corpus lives,
 * rather than guessing at conventional paths.
 */
export function buildAgentManifest(
  options: buildAgentManifest.Options,
): buildAgentManifest.Manifest {
  const { description, siteUrl, title } = options
  const base = siteUrl.replace(/\/$/, '')
  return {
    name: title,
    ...(description ? { description } : {}),
    url: base,
    resources: {
      llms: `${base}/llms.txt`,
      llmsFull: `${base}/llms-full.txt`,
      sitemap: `${base}/sitemap.xml`,
    },
  }
}

export declare namespace buildAgentManifest {
  type Options = {
    /** Site title, used as the manifest `name`. */
    title: string
    /** General site description. Omitted from the manifest when absent. */
    description?: string | undefined
    /** Absolute site origin used to build resource URLs (no trailing slash required). */
    siteUrl: string
  }

  type Manifest = {
    name: string
    description?: string
    url: string
    resources: {
      /** Concise, link-only index of every page. */
      llms: string
      /** Full Markdown corpus of the docs. */
      llmsFull: string
      /** XML sitemap with per-page last-modified dates. */
      sitemap: string
    }
  }
}
