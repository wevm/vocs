import { fromJs } from 'esast-util-from-js'
import type { Program } from 'estree'
import type { Root } from 'mdast'
import type { MdxJsxAttribute, MdxJsxFlowElement, MdxjsEsm } from 'mdast-util-mdx'
import type { Plugin } from 'unified'
import { visit } from 'unist-util-visit'

const sandboxFlag = 'sandbox'
const importSource = 'vocs'

interface Options {
  autoRun: boolean
  showTabs: boolean
  readonly: boolean
  showLineNumbers: boolean
  showPreview: boolean
}

/**
 * Remark plugin that transforms code blocks with `sandbox` meta into <Sandbox> components.
 *
 * @example
 * ```ts sandbox
 * import { createPublicClient } from 'viem'
 * console.log('hello')
 * ```
 *
 * @example With options
 * ```ts sandbox autorun lineNumbers tabs
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
      if (!meta.includes(sandboxFlag)) return

      foundSandbox = true
      const code = node.value
      const { packages, imports } = extractDependencies(code)
      const options = parseOptions(meta)

      const attributes: MdxJsxAttribute[] = [
        createAttribute('code', escapeTemplateString(code)),
        createAttribute('packages', JSON.stringify(packages)),
        createAttribute('imports', JSON.stringify(imports)),
      ]

      if (options.autoRun) attributes.push(createAttribute('autoRun', 'true'))
      if (options.showPreview) attributes.push(createAttribute('showPreview', 'true'))

      const editorProps = buildEditorProps(options)
      if (Object.keys(editorProps).length > 0)
        attributes.push(createAttribute('editorProps', JSON.stringify(editorProps)))

      const element: MdxJsxFlowElement = {
        type: 'mdxJsxFlowElement',
        name: 'Sandbox',
        attributes,
        children: [],
      }

      parent.children.splice(index, 1, element)
    })

    if (foundSandbox && !hasExistingImport(tree)) {
      tree.children.unshift(createImportNode())
    }
  }
}

function parseOptions(meta: string): Options {
  const flags = meta.split(' ').slice(1)
  return {
    autoRun: meta.includes('autorun') && !flags.includes('autorun=false'),
    showLineNumbers: meta.includes('lineNumbers') && !flags.includes('lineNumbers=false'),
    showTabs: meta.includes('tabs') && !flags.includes('tabs=false'),
    readonly: meta.includes('readonly') && !flags.includes('readonly=false'),
    showPreview: meta.includes('preview') && !flags.includes('preview=false'),
  }
}

function extractDependencies(code: string): { packages: string[]; imports: string[] } {
  const packages = new Set<string>()
  const imports = new Set<string>()
  const regex = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g

  for (const match of code.matchAll(regex)) {
    const importPath = match[1]
    if (!importPath || importPath.startsWith('.') || importPath.startsWith('/')) continue

    const pkgName = importPath.startsWith('@')
      ? importPath.split('/').slice(0, 2).join('/')
      : importPath.split('/')[0]

    if (pkgName) {
      packages.add(pkgName)
      imports.add(importPath)
    }
  }

  return { packages: [...packages], imports: [...imports] }
}

function buildEditorProps(options: Options): Record<string, boolean> {
  const props: Record<string, boolean> = {}
  if (!options.showLineNumbers) props['showLineNumbers'] = false
  if (!options.showTabs) props['showTabs'] = false
  if (options.readonly) props['readOnly'] = true
  return props
}

function escapeTemplateString(code: string): string {
  return `\`${code.replaceAll(/\\/g, '\\\\').replaceAll(/`/g, '\\`').replaceAll(/\$/g, '\\$')}\``
}

function createAttribute(name: string, expressionCode: string): MdxJsxAttribute {
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

function hasExistingImport(tree: Root): boolean {
  return tree.children.some(
    (child): child is MdxjsEsm =>
      child.type === 'mdxjsEsm' &&
      typeof child.value === 'string' &&
      child.value.includes(importSource) &&
      child.value.includes('Sandbox'),
  )
}

function createImportNode(): MdxjsEsm {
  const program: Program = {
    type: 'Program',
    sourceType: 'module',
    body: [
      {
        type: 'ImportDeclaration',
        source: { type: 'Literal', value: importSource, raw: `'${importSource}'` },
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
    value: `import { Sandbox } from '${importSource}'\n`,
    data: { estree: program },
  }
}
