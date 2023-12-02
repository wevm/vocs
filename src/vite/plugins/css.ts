import { accessSync } from 'node:fs'
import { resolve } from 'node:path'
import { default as autoprefixer } from 'autoprefixer'
import { default as tailwindcss } from 'tailwindcss'
import { default as tailwindcssNesting } from 'tailwindcss/nesting'
import type { PluginOption } from 'vite'

export function css(): PluginOption {
  return {
    name: 'css',
    async config() {
      const tailwindConfig = findTailwindConfig()
      return {
        css: {
          postcss: {
            plugins: [
              autoprefixer(),
              tailwindcssNesting(),
              tailwindConfig ? tailwindcss() : null,
            ].filter(Boolean) as any,
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
