import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compile } from '@mdx-js/mdx'
import { globby } from 'globby'
import { getRehypePlugins, getRemarkPlugins } from './plugins/mdx.js'
import { resolveVocsConfig } from './utils/resolveVocsConfig.js'

export async function buildTwoslash() {
  const { config } = await resolveVocsConfig()
  const { rootDir } = config
  const pagesPaths = await globby(`${resolve(rootDir, 'pages')}/**/*.{md,mdx}`)

  const rehypePlugins = getRehypePlugins({ rootDir })
  const remarkPlugins = getRemarkPlugins()

  for (const pagePath of pagesPaths) {
    const mdx = readFileSync(pagePath, 'utf-8')
    await compile(mdx, {
      outputFormat: 'function-body',
      rehypePlugins,
      remarkPlugins,
    })
  }
}
