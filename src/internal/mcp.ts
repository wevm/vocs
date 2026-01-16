import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import type { Config } from './config.js'
import type * as McpSource from './mcp-source.js'

/**
 * MCP (Model Context Protocol) server configuration and tools.
 * Allows LLMs to navigate documentation and source code.
 */

export type McpConfig = {
  /**
   * Enable MCP server endpoint at `/api/mcp`.
   * @default false
   */
  enabled?: boolean | undefined
  /**
   * Source code adapter for navigating the codebase.
   * Use `McpSource.github()` to fetch from GitHub.
   *
   * @example
   * ```ts
   * import { McpSource } from 'vocs'
   *
   * export default defineConfig({
   *   mcp: {
   *     enabled: true,
   *     source: McpSource.github({ repo: 'wevm/viem' }),
   *   },
   * })
   * ```
   */
  source?: McpSource.Adapter | undefined
}

/**
 * Create an MCP server instance with all documentation tools registered.
 */
export function createServer(config: Config): McpServer {
  const server = new McpServer(
    {
      name: 'vocs',
      version: '1.0.0',
    },
    { capabilities: { logging: {} } },
  )

  const pagesDir = path.resolve(config.rootDir, config.srcDir, config.pagesDir)

  server.registerTool(
    'list_pages',
    {
      description: 'List all documentation pages with their titles and paths.',
      inputSchema: {},
    },
    async () => {
      const pages = await Array.fromAsync(fs.glob(`${pagesDir}/**/*.{md,mdx}`))

      const results = pages.map((page) => {
        const relativePath = page
          .replace(pagesDir, '')
          .replace(/\.mdx?$/, '')
          .replace(/\/$/, '')
          .replace(/index$/, '')
        return relativePath || '/'
      })

      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      }
    },
  )

  server.registerTool(
    'read_page',
    {
      description: 'Read the content of a documentation page by its path.',
      inputSchema: {
        pagePath: z.string().describe('The page path (e.g., "/getting-started" or "/api/config")'),
      },
    },
    async ({ pagePath }) => {
      const possiblePaths = [
        path.join(pagesDir, `${pagePath}.mdx`),
        path.join(pagesDir, `${pagePath}.md`),
        path.join(pagesDir, pagePath, 'index.mdx'),
        path.join(pagesDir, pagePath, 'index.md'),
      ]

      for (const filePath of possiblePaths) {
        try {
          const content = await fs.readFile(filePath, 'utf-8')
          return { content: [{ type: 'text', text: content }] }
        } catch {}
      }

      return {
        content: [{ type: 'text', text: `Page not found: ${pagePath}` }],
        isError: true,
      }
    },
  )

  server.registerTool(
    'search_docs',
    {
      description: 'Search documentation for a query string.',
      inputSchema: {
        query: z.string().describe('The search query'),
      },
    },
    async ({ query }) => {
      const lowerQuery = query.toLowerCase()
      const pages = await Array.fromAsync(fs.glob(`${pagesDir}/**/*.{md,mdx}`))

      const results: { path: string; snippet: string }[] = []

      for (const page of pages) {
        const content = await fs.readFile(page, 'utf-8')
        if (content.toLowerCase().includes(lowerQuery)) {
          const lines = content.split('\n')
          const matchLine = lines.find((line) => line.toLowerCase().includes(lowerQuery))
          const relativePath = page
            .replace(pagesDir, '')
            .replace(/\.mdx?$/, '')
            .replace(/\/$/, '')
            .replace(/index$/, '')

          results.push({
            path: relativePath || '/',
            snippet: matchLine?.trim().slice(0, 200) || '',
          })
        }
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }],
      }
    },
  )

  const source = config.mcp?.source
  if (source) {
    server.registerTool(
      'list_source_files',
      {
        description: 'List source code files in a directory.',
        inputSchema: {
          dirPath: z.string().optional().describe('Directory path (e.g., "src" or "src/utils")'),
        },
      },
      async ({ dirPath }) => {
        try {
          const files = await source.listFiles(dirPath || '')
          return {
            content: [{ type: 'text', text: JSON.stringify(files, null, 2) }],
          }
        } catch (error) {
          return {
            content: [{ type: 'text', text: String(error) }],
            isError: true,
          }
        }
      },
    )

    server.registerTool(
      'read_source_file',
      {
        description: 'Read a source code file.',
        inputSchema: {
          filePath: z.string().describe('File path (e.g., "src/index.ts")'),
        },
      },
      async ({ filePath }) => {
        console.log('[MCP:Tool] read_source_file called with:', filePath)
        try {
          const content = await source.readFile(filePath)
          console.log('[MCP:Tool] read_source_file success, content length:', content.length)
          return { content: [{ type: 'text', text: content }] }
        } catch (error) {
          console.error('[MCP:Tool] read_source_file error:', error)
          return {
            content: [{ type: 'text', text: String(error) }],
            isError: true,
          }
        }
      },
    )

    server.registerTool(
      'get_file_tree',
      {
        description: 'Get a recursive file tree of the source code.',
        inputSchema: {
          basePath: z.string().optional().describe('Directory path (defaults to configured source path)'),
          depth: z.number().optional().describe('Maximum depth to traverse (default: 3)'),
        },
      },
      async ({ basePath, depth }) => {
        try {
          const result = await source.getTree({ path: basePath, depth })
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  { truncated: result.truncated, count: result.files.length, files: result.files },
                  null,
                  2,
                ),
              },
            ],
          }
        } catch (error) {
          return {
            content: [{ type: 'text', text: String(error) }],
            isError: true,
          }
        }
      },
    )

    if (source.searchCode) {
      server.registerTool(
        'search_source',
        {
          description: 'Search source code for a pattern.',
          inputSchema: {
            query: z.string().describe('The search query'),
            pathFilter: z.string().optional().describe('Optional path filter (e.g., "src/")'),
          },
        },
        async ({ query, pathFilter }) => {
          try {
            const result = await source.searchCode?.(query, pathFilter)
            return {
              content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            }
          } catch (error) {
            return {
              content: [{ type: 'text', text: String(error) }],
              isError: true,
            }
          }
        },
      )
    }
  }

  return server
}
