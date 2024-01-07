/// <reference types="mdast-util-to-hast" />
/// <reference types="mdast-util-directive" />

import { readFileSync } from 'fs'
import { resolve } from 'node:path'
import type { Root, Text } from 'mdast'
import { visit } from 'unist-util-visit'

import type { ContainerDirective } from 'mdast-util-directive'
import { resolveVocsConfig } from '../../utils/resolveVocsConfig.js'

export function remarkSnippets() {
  return async (tree: Root) => {
    const { config } = await resolveVocsConfig()
    const { rootDir } = config

    visit(tree, (node, index, parent) => {
      if (node.type !== 'leafDirective') return
      if (node.name !== 'snip' && node.name !== 'snip-twoslash') return
      if (typeof index !== 'number') return

      const fileName = node.attributes?.path
      if (!fileName) return

      const path = resolve(rootDir, fileName.replace('~', '.'))
      const contents = readFileSync(path, { encoding: 'utf-8' }).replace(/\n$/, '')

      const title = (node.children[0] as Text)?.value
      const lang = path.split('.').pop() as string

      parent?.children.splice(index, 1, {
        type: 'code',
        lang,
        meta: title
          ? `${
              (parent as ContainerDirective).name === 'code-group'
                ? `[${title}]`
                : `title="${title}"`
            } ${node.name === 'snip-twoslash' ? 'twoslash' : ''}}`
          : '',
        value: contents,
      })
    })
  }
}
