import { fromJs } from 'esast-util-from-js'
import type { Program } from 'estree'
import type { Root } from 'mdast'
import type { MdxJsxAttribute, MdxJsxFlowElement, MdxjsEsm } from 'mdast-util-mdx'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

const SANDBOX_FLAG = 'sandbox'
const SANDBOX_IMPORT_SOURCE = 'vocs'

interface SandboxOptions {
  autoRun: boolean
  showLineNumbers: boolean
  showTabs: boolean
}

/**
 * Remark plugin that transforms code blocks with `sandbox` meta into <Sandbox> components.
 *
 * Example:
 * ```ts sandbox autorun lineNumbers=false tabs=false
 * import { createPublicClient } from 'viem'
 * console.log('hello')
 * ```
 */
export const remarkSandbox: Plugin<[], Root> = () => {
  return (tree) => {
    let foundSandbox = false

    visit(tree, 'code', (node, index, parent) => {
      if (!parent || typeof index !== 'number') return

      const meta = node.meta ?? ''
      if (!meta.includes(SANDBOX_FLAG)) return

      foundSandbox = true
      const code = node.value
      const deps = extractDeps(code)
      const options = parseOptions(meta)

      // Strip sandbox flag from meta so rehype-shiki processes it normally
      node.meta = meta.replace(/\bsandbox\b/, '').trim()

      node.lang = node.lang ?? 'txt'

      const sandboxElement: MdxJsxFlowElement = {
        type: 'mdxJsxFlowElement',
        name: 'Sandbox',
        attributes: [
          createJsxExpressionAttribute('code', `\`${escapeTemplateString(code)}\``),
          createJsxExpressionAttribute('deps', JSON.stringify(deps)),
          createJsxExpressionAttribute('autoRun', options.autoRun ? 'true' : 'false'),
          { type: 'mdxJsxAttribute', name: 'lang', value: node.lang ?? 'txt' },
        ],
        children: [],
      }

      parent.children.splice(index, 1, sandboxElement)
    })

    if (!foundSandbox) return

    const hasImport = tree.children.some(
      (child): child is MdxjsEsm =>
        child.type === 'mdxjsEsm' &&
        typeof child.value === 'string' &&
        child.value.includes(SANDBOX_IMPORT_SOURCE) &&
        child.value.includes('Sandbox'),
    )

    if (!hasImport) tree.children.unshift(createSandboxImportNode())
  }
}

function parseOptions(meta: string): SandboxOptions {
  const options: SandboxOptions = {
    autoRun: false,
    showLineNumbers: true,
    showTabs: true,
  }

  if (meta.includes('autorun')) {
    options.autoRun = true
  }

  const lineNumbersMatch = meta.match(/lineNumbers=(true|false)/)
  if (lineNumbersMatch) {
    options.showLineNumbers = lineNumbersMatch[1] === 'true'
  }

  const tabsMatch = meta.match(/tabs=(true|false)/)
  if (tabsMatch) {
    options.showTabs = tabsMatch[1] === 'true'
  }

  return options
}

function extractDeps(code: string): Record<string, string> {
  const deps: Record<string, string> = {}
  const importRegex = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g

  for (const match of code.matchAll(importRegex)) {
    const importPath = match[1]
    if (!importPath || importPath.startsWith('.') || importPath.startsWith('/')) continue

    const pkgName = importPath.startsWith('@')
      ? importPath.split('/').slice(0, 2).join('/')
      : importPath.split('/')[0]

    if (pkgName && !deps[pkgName]) {
      deps[pkgName] = 'latest'
    }
  }

  return deps
}

function escapeTemplateString(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
}

function createJsxExpressionAttribute(name: string, value: string): MdxJsxAttribute {
  const wrappedValue = value.startsWith('{') ? `(${value})` : value
  return {
    type: 'mdxJsxAttribute',
    name,
    value: {
      type: 'mdxJsxAttributeValueExpression',
      value,
      data: {
        estree: fromJs(wrappedValue, { module: false }) as Program,
      },
    },
  }
}

function createSandboxImportNode(): MdxjsEsm {
  const program: Program = {
    type: 'Program',
    sourceType: 'module',
    body: [
      {
        type: 'ImportDeclaration',
        source: {
          type: 'Literal',
          value: SANDBOX_IMPORT_SOURCE,
          raw: `'${SANDBOX_IMPORT_SOURCE}'`,
        },
        attributes: [],
        specifiers: [
          {
            type: 'ImportSpecifier',
            imported: { type: 'Identifier', name: 'Sandbox' },
            local: { type: 'Identifier', name: 'Sandbox' },
          },
        ],
      },
    ],
  }

  return {
    type: 'mdxjsEsm',
    value: `import { Sandbox } from '${SANDBOX_IMPORT_SOURCE}'\n`,
    data: { estree: program },
  }
}
