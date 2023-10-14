import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import { globby } from 'globby'
import * as tailwindcss from 'tailwindcss'
import * as autoprefixer from 'autoprefixer'
import { resolve } from 'node:path'

const pages = ({ paths: glob }: { paths: string }): PluginOption => {
  const virtualModuleId = 'virtual:pages'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  let paths: string[] = []

  return {
    name: 'pages',
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        let code = ''
        paths.forEach((path, i) => {
          code += `import page_${i} from "${path}";`
        })
        
        code += 'export const pages = ['
        paths.forEach((path, i) => {
          const replacer = glob.split('*')[0]
          let pagePath = path.replace(replacer, '').replace(/\.(.*)/, '')
          if (pagePath === 'index') pagePath = ''
          code += `  { path: "/${pagePath}", component: page_${i} },`
        })
        code += ']'
        return code
      }
      return
    },
    async buildStart() {
      paths = await globby(glob)
    },
    handleHotUpdate() {
      // handle changes
      return
    },
  }
}

export default defineConfig({
  css: {
    postcss: {
      plugins: [
        (autoprefixer as any).default(),
        tailwindcss.default({
          content: [resolve(__dirname, './**/*.{html,tsx,ts,js,jsx}')],
        }),
      ],
    },
  },
  plugins: [
    react(),
    mdx(),
    pages({ paths: resolve(process.cwd(), './pages/**/*.{md,mdx,ts,tsx,js,jsx}') }),
  ],
})
