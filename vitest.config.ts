import path from 'node:path'
import { getIconData, iconToHTML, iconToSVG } from '@iconify/utils'
import { type IconifyJSON, icons as lucide } from '@iconify-json/lucide'
import { icons as simple } from '@iconify-json/simple-icons'
import Icons from 'unplugin-icons/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Resolve `~icons/*` imports the same way the Vocs Vite plugin does
  // (src/vite.ts), so components that import icons can be rendered in tests.
  plugins: [
    Icons({
      compiler: 'jsx',
      customCollections: {
        lucide: getIcon(lucide),
        'simple-icons': getIcon(simple),
      },
      jsx: 'react',
    }),
  ],
  test: {
    alias: {
      vocs: path.resolve(import.meta.dirname, 'src'),
      // Virtual modules are provided by Vite plugins at dev/build time and don't
      // exist under vitest; map the ones imported by tested components to stubs.
      'virtual:vocs/config': path.resolve(
        import.meta.dirname,
        'src/internal/test/virtual-config.stub.ts',
      ),
    },
    include: ['./src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
    globals: true,
    passWithNoTests: true,
  },
})

function getIcon(set: IconifyJSON) {
  return async (name: string) => {
    const data = getIconData(set, name)
    if (!data) return undefined
    const { attributes, body } = iconToSVG(data)
    return iconToHTML(body, attributes)
  }
}
