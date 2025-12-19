import fs from 'node:fs/promises'
import path from 'node:path'
import type { Config } from '@react-router/dev/config'
import type { PluginOption } from 'vite'

export function reactRouterConfig(c?: Config): PluginOption {
  const prerender = (() => {
    if (!c?.prerender) return undefined

    const prerender = {
      paths: true,
      unstable_concurrency: 999,
    }
    if (c.prerender === true) return prerender
    if (Array.isArray(c.prerender)) return { ...prerender, paths: c.prerender }
    return { ...prerender, ...c.prerender }
  })()

  const config = {
    ...c,
    ...(prerender ? { prerender } : undefined),
  } satisfies Config

  return {
    name: 'vocs:react-router-config',
    enforce: 'pre',
    async config(viteConfig) {
      {
        const configPath = path.join(import.meta.dirname, '../../.vocs/react-router.config.ts')
        await fs.mkdir(path.dirname(configPath), { recursive: true }).catch(() => {})
        const content = 'export default ' + JSON.stringify(config, null, 2)
        await fs.writeFile(configPath, content)
      }

      {
        const root = viteConfig.root ?? process.cwd()
        const userConfigPath = path.join(root, 'react-router.config.ts')

        const content = []
        const userContent = await fs.readFile(userConfigPath, 'utf-8').catch(() => undefined)

        const generatedContent = [
          "import { config } from 'vocs/react-router/config'",
          'export default config',
        ].join('\n')

        // Remove `react-router.config.ts` if the config is empty, and there is
        // no user config.
        if (
          Object.keys(config).length === 0 &&
          (!userContent || userContent?.startsWith(generatedContent))
        )
          return await fs.rm(userConfigPath).catch(() => {})

        // If there is user config, we will wrap it in `withVocsConfig`.
        if (userContent?.includes('export default')) {
          if (userContent.includes('vocs/react-router/config')) return

          content.push(
            "import { withVocsConfig } from 'vocs/react-router/config'",
            '',
            userContent.replace('export default', 'const config ='),
            '',
            'export default withVocsConfig(config)',
          )
        } else content.push(generatedContent)

        await fs.writeFile(userConfigPath, content.join('\n'))
      }
    },
  }
}
