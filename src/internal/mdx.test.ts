import ruby from 'shiki/langs/ruby.mjs'
import { describe, expect, it } from 'vitest'
import * as Config from './config.js'
import { getCompileOptions, remarkCodeTitle } from './mdx.js'

describe('getCompileOptions', () => {
  it('preserves configured custom language fences', () => {
    const config = Config.define({
      codeHighlight: { langs: ruby },
      rootDir: process.cwd(),
    })

    const { remarkPlugins } = getCompileOptions('react', config)
    const codeTitlePlugin = remarkPlugins.find(
      (plugin): plugin is [typeof remarkCodeTitle, remarkCodeTitle.Options] =>
        Array.isArray(plugin) && plugin[0] === remarkCodeTitle,
    )

    expect(codeTitlePlugin).toBeDefined()
    if (!codeTitlePlugin) throw new Error('remarkCodeTitle plugin not found')

    expect(codeTitlePlugin[1].additionalLanguages).toEqual(expect.arrayContaining(['rb', 'ruby']))

    const tree = {
      type: 'root',
      children: [
        {
          type: 'code',
          lang: 'ruby',
          meta: '[server.rb]',
          value: 'require "mpp"',
        },
      ],
    }

    remarkCodeTitle(codeTitlePlugin[1])(tree as never)

    const codeNode = tree.children[0]
    if (!codeNode) throw new Error('code node missing')

    expect(codeNode.lang).toBe('ruby')
    expect(codeNode.meta).toBe('[server.rb]')
  })
})
