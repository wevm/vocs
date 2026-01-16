/**
 * MCP Source Adapters for navigating source code.
 */

export type Adapter = {
  /** Unique name/identifier for this source */
  name?: string | undefined
  /** Adapter type identifier */
  type: string
  /** List files in a directory */
  listFiles: (path: string) => Promise<FileEntry[]>
  /** Read a file's content */
  readFile: (path: string) => Promise<string>
  /** Get the full file tree */
  getTree: (options?: {
    path?: string | undefined
    depth?: number | undefined
  }) => Promise<TreeResult>
  /** Search for code (optional - may not be supported by all adapters) */
  searchCode?: (query: string, path?: string) => Promise<SearchResult>
}

export type FileEntry = {
  name: string
  path: string
  type: 'file' | 'directory'
}

export type TreeResult = {
  files: FileEntry[]
  truncated: boolean
}

export type SearchResult = {
  total: number
  results: { name: string; path: string; url?: string }[]
}

/**
 * Creates a source adapter from a custom adapter definition.
 *
 * @example
 * ```ts
 * import { McpSource } from 'vocs'
 *
 * export default defineConfig({
 *   mcp: {
 *     enabled: true,
 *     sources: [
 *       McpSource.from({
 *         name: 'my-source',
 *         type: 'custom',
 *         async listFiles(path) { ... },
 *         async readFile(path) { ... },
 *         async getTree() { ... },
 *       }),
 *     ],
 *   },
 * })
 * ```
 */
export function from(adapter: Adapter): Adapter {
  return adapter
}

/**
 * Creates a GitHub source adapter.
 *
 * @example
 * ```ts
 * import { McpSource } from 'vocs'
 *
 * export default defineConfig({
 *   mcp: {
 *     enabled: true,
 *     sources: [
 *       McpSource.github({ name: 'viem', repo: 'wevm/viem' }),
 *     ],
 *   },
 * })
 * ```
 */
export function github(options: github.Options): Adapter {
  const { name, repo, branch = 'main', token, paths = ['src'] } = options

  async function fetchGitHub(url: string): Promise<Response> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'vocs-mcp',
    }
    const apiToken = token || process.env['GITHUB_TOKEN']
    if (apiToken) headers['Authorization'] = `Bearer ${apiToken}`

    return fetch(url, { headers })
  }

  return {
    name: name ?? repo,
    type: 'github',

    async listFiles(dirPath: string) {
      const targetPath = dirPath || paths[0] || 'src'
      const url = `https://api.github.com/repos/${repo}/contents/${targetPath}?ref=${branch}`
      const response = await fetchGitHub(url)

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = (await response.json()) as { name: string; type: string; path: string }[]
      return data.map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type === 'dir' ? 'directory' : 'file',
      })) as FileEntry[]
    },

    async readFile(filePath: string) {
      const url = `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`File not found: ${filePath}`)
      }

      return response.text()
    },

    async getTree(opts = {}) {
      const { path: basePath = paths[0] || '', depth = 3 } = opts

      const url = `https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`
      const response = await fetchGitHub(url)

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = (await response.json()) as {
        tree: { path: string; type: string }[]
        truncated: boolean
      }

      const baseDepth = basePath ? basePath.split('/').filter(Boolean).length : 0

      const files = data.tree
        .filter((item) => {
          if (basePath && !item.path.startsWith(basePath)) return false
          const itemDepth = item.path.split('/').filter(Boolean).length
          return itemDepth <= baseDepth + depth
        })
        .map((item) => ({
          name: item.path.split('/').pop() || item.path,
          path: item.path,
          type: item.type === 'tree' ? 'directory' : 'file',
        })) as FileEntry[]

      return { files, truncated: data.truncated }
    },

    async searchCode(query: string, pathFilter?: string) {
      let searchQuery = `${query} repo:${repo}`
      if (pathFilter) searchQuery += ` path:${pathFilter}`

      const url = `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}&per_page=20`
      const response = await fetchGitHub(url)

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error(
            'GitHub code search requires authentication. Set GITHUB_TOKEN environment variable.',
          )
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = (await response.json()) as {
        total_count: number
        items: { name: string; path: string; html_url: string }[]
      }

      return {
        total: data.total_count,
        results: data.items.map((item) => ({
          name: item.name,
          path: item.path,
          url: item.html_url,
        })),
      }
    },
  }
}

export declare namespace github {
  type Options = {
    /**
     * Unique name/identifier for this source.
     * Defaults to repo name if not provided.
     * @example "viem"
     */
    name?: string | undefined
    /**
     * GitHub repository in "owner/repo" format.
     * @example "wevm/viem"
     */
    repo: string
    /**
     * Branch to use for source code navigation.
     * @default "main"
     */
    branch?: string | undefined
    /**
     * GitHub API token for authenticated requests (higher rate limits).
     * Falls back to GITHUB_TOKEN environment variable.
     */
    token?: string | undefined
    /**
     * Paths within the repo to expose for source navigation.
     * @default ["src"]
     */
    paths?: readonly string[] | undefined
  }
}
