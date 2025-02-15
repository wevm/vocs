import { default as autoprefixer } from 'autoprefixer'
import type { PluginOption } from 'vite'

export function css(): PluginOption {
  return {
    name: 'css',
    async config() {
      return {
        css: {
          postcss: {
            plugins: [autoprefixer()].filter(Boolean) as any,
          },
        },
      }
    },
  }
}
