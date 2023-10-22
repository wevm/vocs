import { accessSync } from 'node:fs'
import { resolve } from 'node:path'
import * as autoprefixer from 'autoprefixer'
import * as tailwindcss from 'tailwindcss'
import type { PluginOption } from 'vite'

export function css(): PluginOption {
  const tailwindConfig = findTailwindConfig()

  return {
    name: 'css',
    config() {
      return {
        css: {
          postcss: {
            plugins: [
              (autoprefixer as any).default(),
              tailwindConfig
                ? tailwindcss.default({
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

export function findTailwindConfig() {
  const configFiles = [
    './tailwind.config.js',
    './tailwind.config.cjs',
    './tailwind.config.mjs',
    './tailwind.config.ts',
  ]
  for (const configFile of configFiles) {
    try {
      const configPath = resolve(process.cwd(), configFile)
      accessSync(configPath)
      return configPath
    } catch (err) {}
  }

  return null
}
