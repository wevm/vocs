import { readdirSync } from 'node:fs'
import { extname, resolve } from 'node:path'

import { defineConfig } from '../../src/index.js'

function benchSidebarItems() {
  try {
    const benchDir = resolve(import.meta.dirname, './docs/pages/bench')
    const files = readdirSync(benchDir).filter((file) => ['.md', '.mdx'].includes(extname(file)))

    const items = files
      .filter((file: string) => file !== 'index.mdx' && file !== 'index.md')
      .sort()
      .map((file) => {
        const slug = file.replace(extname(file), '')
        return {
          text: slug,
          link: `/bench/${slug}`,
        }
      })

    return {
      count: items.length,
      items,
    }
  } catch {
    return { count: 0, items: [] }
  }
}

const benchSidebar = benchSidebarItems()

export default defineConfig({
  sidebar: [
    {
      text: 'Introduction',
      link: '/docs',
    },
    {
      text: `Bench (${benchSidebar.count || '0'})`,
      collapsed: true,
      items: [{ text: 'Index', link: '/bench' }, ...benchSidebar.items],
    },
  ],
  theme: {
    accentColor: 'red',
  },
  title: 'Awesome Docs',
})
