import { fromJs } from 'esast-util-from-js'
import type { Program } from 'estree'
import type { Code, Root } from 'mdast'
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

    visit(tree, 'code', (node: Code, index, parent) => {
      if (!parent || typeof index !== 'number') return

      const meta = node.meta ?? ''
      if (!meta.includes(SANDBOX_FLAG)) return

      foundSandbox = true
      const code = node.value
      const deps = extractDeps(code)
      const options = parseOptions(meta)

      const attributes: MdxJsxAttribute[] = [
        createJsxAttribute('code', `\`${escapeTemplateString(code)}\``),
        createJsxAttribute('deps', JSON.stringify(deps)),
      ]

      if (options.autoRun) {
        attributes.push(createJsxAttribute('autoRun', 'true'))
      }

      // Build editorProps if any editor options are set
      const editorProps: Record<string, boolean> = {}
      if (!options.showLineNumbers) editorProps['showLineNumbers'] = false
      if (!options.showTabs) editorProps['showTabs'] = false

      if (Object.keys(editorProps).length > 0) {
        attributes.push(createJsxAttribute('editorProps', JSON.stringify(editorProps)))
      }

      const sandboxElement: MdxJsxFlowElement = {
        type: 'mdxJsxFlowElement',
        name: 'Sandbox',
        attributes,
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

function createJsxAttribute(name: string, expressionCode: string): MdxJsxAttribute {
  // Wrap in parens so objects parse as expressions, not blocks
  const estree = fromJs(`(${expressionCode})`, { module: false })
  return {
    type: 'mdxJsxAttribute',
    name,
    value: {
      type: 'mdxJsxAttributeValueExpression',
      value: expressionCode,
      data: { estree },
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
