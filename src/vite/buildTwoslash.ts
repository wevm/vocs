import { globby } from 'globby'
import { resolveVocsConfig } from './utils/resolveVocsConfig.js'
import { resolve } from 'node:path'
import { readFileSync } from 'node:fs'
import { compile } from '@mdx-js/mdx'
import { getRehypePlugins, getRemarkPlugins } from './plugins/mdx.js'


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
