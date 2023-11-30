import { accessSync } from 'node:fs'
import { resolve } from 'node:path'
import { default as autoprefixer } from 'autoprefixer'
import { default as tailwindcss } from 'tailwindcss'
import { default as tailwindcssNesting } from 'tailwindcss/nesting'
import type { PluginOption } from 'vite'

import { resolveVocsConfig } from '../utils/resolveVocsConfig.js'

export function css(): PluginOption {
  return {
    name: 'css',
    async config() {
      const { config } = await resolveVocsConfig()
      const { rootDir } = config
      const tailwindConfig = findTailwindConfig({ rootDir })
      return {
        css: {
          postcss: {
            plugins: [
              autoprefixer(),
              tailwindcssNesting(),
              tailwindConfig
                ? (tailwindcss as any)({
                    config: tailwindConfig,
                  })
                : undefined,
            ].filter(Boolean),
          },
        },
      }
    },
  }
}

//////////////////////////////////////////////////
// Tailwind

export function findTailwindConfig({ rootDir }: { rootDir: string }) {
  const configFiles = [
    './tailwind.config.js',
    './tailwind.config.cjs',
    './tailwind.config.mjs',
    './tailwind.config.ts',
  ]
  for (const configFile of configFiles) {
    try {
      const configPath = resolve(rootDir, configFile)
      accessSync(configPath)
      return configPath
    } catch (err) {}
  }

  return null
}
