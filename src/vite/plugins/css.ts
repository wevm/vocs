import { accessSync } from 'node:fs'
import { resolve } from 'node:path'
import { default as autoprefixer } from 'autoprefixer'
import { default as tailwindcss } from 'tailwindcss'
import { default as tailwindcssNesting } from 'tailwindcss/nesting'
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
