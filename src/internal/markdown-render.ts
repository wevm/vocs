/**
 * Renders MDX as Markdown. Pure and Workers-safe: it parses the source, reads literal props only,
 * and never evaluates MDX JavaScript or loads component modules. Each component goes through a
 * renderer looked up by its imported name, intrinsic HTML elements lower to Markdown, and
 * ordinary Markdown keeps its source bytes.
 */
import type * as Estree from 'estree'
import type * as EstreeJsx from 'estree-jsx'
import type * as MdAst from 'mdast'
import { gfmToMarkdown } from 'mdast-util-gfm'
import { mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { toString as nodeToString } from 'mdast-util-to-string'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

/** A literal prop value. JSX in a prop renders to `{ markdown }`. */
export type Value =
  | string
  | number
  | boolean
  | null
  | undefined
  | Value[]
  | { [key: string]: Value }
  | { markdown: string }

export type Props = Record<string, unknown>

/** What a renderer returns: Markdown text, or Markdown (mdast) nodes. */
export type Result = string | MdAst.RootContent | MdAst.RootContent[]

/** Turns one component of a page into Markdown. */
export type Renderer<props = Props, context = unknown> = (
  props: props,
  element: Element<props, context>,
) => Result | Promise<Result>

export type Element<props = Props, context = unknown> = {
  /** The Markdown of the component's children. */
  children(): string
  /** The `context` passed to {@link render}, such as data the page's components list. */
  context: context
  /** True when the component occurs inside a paragraph; return inline (phrasing) content. */
  inline: boolean
  /** The name the renderer was looked up by, such as `Card` or `Tabs.Tab`. */
  name: string
  /** Canonical route of the containing page. */
  pageUrl: string
  /** The component's props, read as literal values. */
  props: props
  /** The component's children as transformed Markdown nodes; return these to unwrap a layout. */
  renderChildren(): MdAst.RootContent[]
}

/** A component as the page imports it, for {@link render.Options.resolve}. */
export type Component = {
  /**
   * The name it is rendered by: the imported export with any member path (`Card`, `Tabs.Tab`), or
   * the local name of a default import.
   */
  name: string
  /** The import specifier, or `undefined` for a component the page does not import. */
  source: string | undefined
  /** The import's export name: an export, `default`, or `*` for a namespace import. */
  export: string | undefined
  /** True when the element has no attributes and no children. */
  empty: boolean
  /** True when the element occurs inside a paragraph. */
  inline: boolean
}

/**
 * Renders a page's MDX body as Markdown.
 *
 * Ordinary Markdown keeps its source bytes. Each JSX component goes through the renderer of its
 * imported name, such as `Card` for `import { Card as Box } from '…'`. Intrinsic HTML elements
 * (`a`, `img`, headings, lists, tables, `iframe`, `video`, …) lower to their Markdown form.
 *
 * @example
 * ```ts
 * import { MarkdownRender } from 'vocs/server'
 *
 * const markdown = await MarkdownRender.render(source, {
 *   context: { posts },
 *   renderers: {
 *     Button: (props, element) => `[${element.children()}](${props.href})`,
 *     PostList: (_props, element) =>
 *       element.context.posts.map((post) => `- [${post.title}](${post.href})`).join('\n'),
 *   },
 * })
 * ```
 *
 * @throws {Error} With `onMissing: 'throw'` (the default), when a component has no renderer, a
 *   prop or expression is not literal, or an HTML element has no Markdown form.
 */
export async function render<context = undefined>(
  source: string,
  options: render.Options<context> = {},
): Promise<string> {
  const {
    context,
    intrinsic = true,
    onMissing = 'throw',
    pageUrl = '/',
    renderers = {},
    resolve,
  } = options
  const keep = onMissing === 'keep'
  const tree = unified().use(remarkParse).use(remarkMdx).use(remarkGfm).parse(source)

  const imports = new Map<string, { export: string; source: string }>()
  for (const node of tree.children) {
    if (node.type !== 'mdxjsEsm') continue
    for (const statement of node.data?.estree?.body ?? []) {
      if (statement.type !== 'ImportDeclaration' || typeof statement.source.value !== 'string')
        continue
      for (const specifier of statement.specifiers)
        imports.set(specifier.local.name, {
          export:
            specifier.type === 'ImportNamespaceSpecifier'
              ? '*'
              : specifier.type === 'ImportDefaultSpecifier'
                ? 'default'
                : specifier.imported.type === 'Identifier'
                  ? specifier.imported.name
                  : String(specifier.imported.value),
          source: statement.source.value,
        })
    }
  }

  // Thrown to keep an element whose props or children cannot be rendered (`onMissing: 'keep'`).
  const missing = Symbol('missing')
  const fail = (message: string): never => {
    if (keep) throw missing
    throw new Error(message)
  }

  async function lookup(jsxName: string, empty: boolean, inline: boolean) {
    const [local = '', ...members] = jsxName.split('.')
    const imported = imports.get(local)
    const name = imported
      ? imported.export === '*'
        ? members.join('.')
        : imported.export === 'default'
          ? [local, ...members].join('.')
          : [imported.export, ...members].join('.')
      : jsxName
    const renderer =
      (Object.hasOwn(renderers, name) ? renderers[name] : undefined) ??
      (await resolve?.({
        name,
        source: imported?.source,
        export: imported?.export,
        empty,
        inline,
      }))
    return { name, renderer }
  }

  /** Renders an element by name. Returns `undefined` when the element stays as written. */
  async function element(
    jsxName: string | null,
    props: Props,
    children: MdAst.RootContent[],
    inline: boolean,
    empty: boolean,
  ): Promise<MdAst.RootContent[] | undefined> {
    const lowercase = !jsxName || /^[a-z]/.test(jsxName)
    const { name, renderer } = jsxName
      ? await lookup(jsxName, empty, inline)
      : { name: '', renderer: undefined }
    if (renderer) {
      const result = await renderer(props, {
        children: () => serialize(children, inline),
        context: context as context,
        inline,
        name,
        pageUrl,
        props,
        renderChildren: () => children,
      })
      const nodes = toNodes(result)
      if (!nodes)
        throw new TypeError(
          `<${name}>: a Markdown renderer must return a string, a Markdown node, or an array of nodes.`,
        )
      if (inline && nodes.some((node) => !phrasingTypes.has(node.type)))
        throw new TypeError(`<${name}>: an inline Markdown renderer must return phrasing nodes.`)
      return nodes
    }
    if (lowercase) {
      if (!intrinsic) return undefined
      // An inline element that lowers to blocks, such as `<h2>Title</h2>` on its own line, lifts
      // out of its paragraph.
      const nodes = lower(jsxName, props, children)
      if (nodes) return inline ? nodes : flow(nodes)
    }
    return fail(`Missing Markdown renderer for <${name}>.`)
  }

  /** Reads a literal value from an expression; JSX renders to `{ markdown }`. */
  async function literal(node: Estree.Node | EstreeJsx.Node | null | undefined): Promise<Value> {
    switch (node?.type) {
      case 'Literal':
        if (node.value === null || ['boolean', 'number', 'string'].includes(typeof node.value))
          return node.value as string | number | boolean | null
        break
      case 'TemplateLiteral':
        if (node.expressions.length === 0)
          return node.quasis.map((part) => part.value.cooked ?? part.value.raw).join('')
        break
      case 'UnaryExpression': {
        if (node.operator !== '-' && node.operator !== '+') break
        const argument = await literal(node.argument)
        if (typeof argument === 'number') return node.operator === '-' ? -argument : argument
        break
      }
      case 'ArrayExpression':
        return Promise.all(
          node.elements.map((item) =>
            !item || item.type === 'SpreadElement'
              ? fail('Markdown props must be literal array elements.')
              : literal(item),
          ),
        )
      case 'ObjectExpression': {
        const entries = await Promise.all(
          node.properties.map(async (property) => {
            if (
              property.type !== 'Property' ||
              property.computed ||
              property.kind !== 'init' ||
              property.method ||
              property.shorthand
            )
              return fail('Markdown props must be literal object properties.')
            const key =
              property.key.type === 'Identifier' ? property.key.name : await literal(property.key)
            return [String(key), await literal(property.value)] as const
          }),
        )
        return Object.fromEntries(entries)
      }
      case 'JSXElement':
      case 'JSXFragment':
        return { markdown: serialize(await jsx(node), true) }
    }
    return fail(`Markdown props and expressions must be literal, not ${node?.type}.`)
  }

  /** Renders JSX inside a prop value as inline Markdown nodes. */
  async function jsx(
    node: EstreeJsx.JSXElement | EstreeJsx.JSXFragment,
  ): Promise<MdAst.PhrasingContent[]> {
    const children: MdAst.RootContent[] = []
    for (const child of node.children) {
      if (child.type === 'JSXText') {
        const value = child.value
          .split('\n')
          .map((line, index, lines) => {
            if (index > 0) line = line.trimStart()
            if (index < lines.length - 1) line = line.trimEnd()
            return line
          })
          .filter(Boolean)
          .join(' ')
        if (value) children.push({ type: 'text', value })
      } else if (child.type === 'JSXExpressionContainer') {
        if (child.expression.type === 'JSXEmptyExpression') continue
        children.push(...toValueNodes(await literal(child.expression)))
      } else if (child.type === 'JSXSpreadChild') fail('Spread children have no Markdown form.')
      else children.push(...(await jsx(child)))
    }
    if (node.type === 'JSXFragment') return phrasing(children)

    const { attributes, name } = node.openingElement
    const jsxName =
      name.type === 'JSXIdentifier'
        ? name.name
        : name.type === 'JSXMemberExpression'
          ? memberName(name)
          : fail('Namespaced JSX has no Markdown form.')
    const props: Props = {}
    for (const attribute of attributes) {
      if (attribute.type !== 'JSXAttribute' || attribute.name.type !== 'JSXIdentifier')
        return fail('Markdown props must be static attributes.')
      const value = attribute.value
      props[attribute.name.name] =
        value === null || value === undefined
          ? true
          : value.type === 'Literal'
            ? value.value
            : value.type === 'JSXExpressionContainer'
              ? value.expression.type === 'JSXEmptyExpression'
                ? undefined
                : await literal(value.expression)
              : await literal(value)
    }
    const rendered = await element(
      jsxName,
      props,
      children,
      true,
      attributes.length === 0 && children.length === 0,
    )
    return phrasing(rendered ?? fail(`<${jsxName}> has no Markdown form.`))
  }

  async function readProps(node: MdxJsxElement): Promise<Props> {
    const props: Props = {}
    for (const attribute of node.attributes) {
      if (attribute.type !== 'mdxJsxAttribute')
        return fail('Spread props are not supported in Markdown.')
      const value = attribute.value
      if (value === null || value === undefined) props[attribute.name] = true
      else if (typeof value === 'string') props[attribute.name] = value
      else {
        const statement = value.data?.estree?.body[0]
        if (statement?.type !== 'ExpressionStatement')
          return fail(`Expected literal content for ${attribute.name}.`)
        props[attribute.name] = await literal(statement.expression)
      }
    }
    return props
  }

  // Rendered nodes replace their source range; changed nodes splice their children's output.
  const replaced = new Map<MdAst.Node, MdAst.RootContent[]>()
  const changed = new WeakSet<MdAst.Node>()
  const originals = new Map<MdAst.Node, MdAst.RootContent[]>()

  async function transform(node: MdAst.RootContent): Promise<MdAst.RootContent[]> {
    if (node.type === 'mdxjsEsm') {
      // With every component rendered, imports and exports are dead code.
      if (keep) return [node]
      replaced.set(node, [])
      return []
    }
    if (node.type === 'mdxFlowExpression' || node.type === 'mdxTextExpression') {
      const statement = node.data?.estree?.body[0]
      try {
        // An empty expression holds only a comment.
        const nodes = !statement
          ? []
          : statement.type === 'ExpressionStatement'
            ? toValueNodes(await literal(statement.expression))
            : fail('Expected a literal MDX expression.')
        const result = node.type === 'mdxTextExpression' ? nodes : flow(nodes)
        replaced.set(node, result)
        return result
      } catch (error) {
        if (error === missing) return [node]
        throw error
      }
    }

    let children: MdAst.RootContent[] | undefined
    if ('children' in node) {
      const original = [...node.children] as MdAst.RootContent[]
      originals.set(node, original)
      children = (await Promise.all(original.map(transform))).flat()
      node.children = children as typeof node.children
      if (original.some((child) => replaced.has(child) || changed.has(child))) changed.add(node)
      if (node.type === 'paragraph' && children.some((child) => !phrasingTypes.has(child.type))) {
        const result = flow(children)
        replaced.set(node, result)
        return result
      }
    }
    if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return [node]

    try {
      const props = await readProps(node)
      const result = await element(
        node.name,
        props,
        children ?? [],
        node.type === 'mdxJsxTextElement',
        node.attributes.length === 0 && node.children.length === 0,
      )
      if (!result) return [node]
      replaced.set(node, result)
      return result
    } catch (error) {
      if (error === missing) return [node]
      throw error
    }
  }

  for (const node of tree.children) await transform(node)

  function emit(node: MdAst.Node, inline: boolean): string {
    const nodes = replaced.get(node)
    if (nodes) {
      const markdown = serialize(nodes, inline)
      return markdown
    }
    const start = node.position?.start.offset ?? 0
    const end = node.position?.end.offset ?? start
    let text = source.slice(start, end)
    if (!changed.has(node)) return text
    const childInline = phrasingParents.has(node.type)
    const children = originals.get(node) ?? []
    for (const [index, child] of [...children.entries()].reverse()) {
      const next = children[index + 1]
      // A rendered block needs a blank line before its next sibling block. Splices so far are at or
      // after `next`, so the gap still has its source offsets.
      if (!childInline && next && (replaced.has(child) || replaced.has(next))) {
        const gapFrom = (child.position?.end.offset ?? 0) - start
        const gapTo = (next.position?.start.offset ?? 0) - start
        const gap = text.slice(gapFrom, gapTo)
        if (gap.includes('\n') && !/\n[ \t>]*\n/.test(gap))
          text =
            text.slice(0, gapFrom) +
            gap.replace(
              '\n',
              `\n${prefix(start + gapTo)
                .replace(/[^>\s]/g, ' ')
                .trimEnd()}\n`,
            ) +
            text.slice(gapTo)
      }
      if (!replaced.has(child) && !changed.has(child)) continue
      const from = (child.position?.start.offset ?? 0) - start
      const to = (child.position?.end.offset ?? 0) - start
      let value = emit(child, childInline || child.type === 'mdxJsxTextElement')
      // A cell is one line, and an unescaped pipe would split it.
      if (node.type === 'tableCell')
        value = value
          .trim()
          .replace(/\n/g, '<br>')
          .replace(/(?<!\\)\|/g, '\\|')
      // The source prefix before a rendered node is its whole container prefix, so only the
      // innermost splice indents; an ancestor splices text that already carries it.
      else if (replaced.has(child) && value.includes('\n')) value = indent(value, start + from)
      text = text.slice(0, from) + value + text.slice(to)
    }
    return text
  }

  // The source from the start of the line to `offset`, such as a container's `> - `.
  function prefix(offset: number) {
    return source.slice(source.lastIndexOf('\n', offset - 1) + 1, offset)
  }

  // Blocks in containers (`>`, list items, indented JSX) continue on their container's prefix.
  function indent(value: string, offset: number) {
    const line = prefix(offset)
    if (!/^[\s>*+\-\d.)]*$/.test(line)) return value
    const continuation = line.replace(/[^>\s]/g, ' ')
    return value
      .replace(/\n$/, '')
      .split('\n')
      .map((line, index) => (index === 0 ? line : `${continuation}${line}`.trimEnd()))
      .join('\n')
      .concat(value.endsWith('\n') ? '\n' : '')
  }

  // Keep the source between top-level nodes (blank lines, trailing newline), and drop the gap of a
  // node that renders to nothing, such as an import.
  let output = ''
  let end = 0
  let previous: MdAst.Node | undefined
  for (const node of tree.children) {
    const text = emit(node, false)
    let gap = source.slice(end, node.position?.start.offset)
    end = node.position?.end.offset ?? end
    if (!text && replaced.has(node)) continue
    if (!output) gap = gap.replace(/^\n+/, '')
    // A rendered block needs a blank line between it and its neighbors.
    else if ((replaced.has(node) || (previous && replaced.has(previous))) && !/\n.*\n/s.test(gap))
      gap = '\n\n'
    output += gap + text
    previous = node
  }
  return output + source.slice(end)
}

export declare namespace render {
  type Options<context = undefined> = {
    /** Data that renderers read as `element.context`, such as a collection's entries. */
    context?: context | undefined
    /**
     * Lower intrinsic HTML elements (`a`, `img`, `h1`–`h6`, `p`, lists, tables, `iframe`,
     * `video`, …) to Markdown. With `false`, HTML elements stay as written.
     * @default true
     */
    intrinsic?: boolean | undefined
    /**
     * What happens to a component without a renderer, a non-literal prop or expression, or an
     * HTML element without a Markdown form: `throw` an error, or `keep` it as written (with its
     * children rendered), along with the page's imports.
     * @default 'throw'
     */
    onMissing?: 'throw' | 'keep' | undefined
    /** Canonical route of the page, passed to renderers. @default '/' */
    pageUrl?: string | undefined
    /**
     * The renderer of each component, by its imported name (`Card` for `import { Card as Box }`,
     * `Tabs.Tab` for a member), or the local name of a default import or an unimported component.
     * Lowercase keys override the lowering of that HTML element.
     */
    renderers?: Readonly<Record<string, AnyRenderer<context>>> | undefined
    /** Looks up a renderer that `renderers` does not hold, such as by the import's module. */
    resolve?:
      | ((
          component: Component,
        ) => AnyRenderer<context> | undefined | Promise<AnyRenderer<context> | undefined>)
      | undefined
  }
}

// A renderer may narrow its props, such as `(props: { title: string }) => …`.
// biome-ignore lint/suspicious/noExplicitAny: _
type AnyRenderer<context> = Renderer<any, context>

type MdxJsxElement = Extract<MdAst.RootContent, { type: 'mdxJsxFlowElement' | 'mdxJsxTextElement' }>

const phrasingTypes = new Set([
  'break',
  'delete',
  'emphasis',
  'footnoteReference',
  'html',
  'image',
  'imageReference',
  'inlineCode',
  'link',
  'linkReference',
  'mdxJsxTextElement',
  'mdxTextExpression',
  'strong',
  'text',
])

// Nodes whose children are inline content.
const phrasingParents = new Set([
  'delete',
  'emphasis',
  'heading',
  'link',
  'linkReference',
  'mdxJsxTextElement',
  'paragraph',
  'strong',
  'tableCell',
])

const extensions = [mdxToMarkdown(), gfmToMarkdown()]

/** Serializes nodes as Markdown, without a trailing newline. */
function serialize(nodes: readonly MdAst.RootContent[], inline: boolean): string {
  if (!nodes.length) return ''
  const inlineNodes = inline ? phrasing(nodes) : []
  const children = inline
    ? [{ type: 'paragraph' as const, children: inlineNodes }]
    : (flow(nodes) as MdAst.RootContent[])
  const markdown = toMarkdown({ type: 'root', children }, { extensions })
  if (!inline) return markdown.trimEnd()
  // A trailing hard break ends in the newline that makes it a break; keep it.
  return inlineNodes.at(-1)?.type === 'break' ? markdown : markdown.replace(/\n$/, '')
}

// Markdown text becomes a raw node, which serializes byte for byte.
function toNodes(result: Result): MdAst.RootContent[] | undefined {
  if (typeof result === 'string') return result ? [{ type: 'html', value: result }] : []
  const nodes = Array.isArray(result) ? result : [result]
  if (!nodes.every((node) => node && typeof node === 'object' && typeof node.type === 'string'))
    return undefined
  return nodes
}

function toValueNodes(value: Value): MdAst.RootContent[] {
  if (value === null || value === undefined || typeof value === 'boolean') return []
  if (typeof value === 'string' || typeof value === 'number')
    return [{ type: 'text', value: String(value) }]
  if (!Array.isArray(value) && typeof value.markdown === 'string')
    return [{ type: 'html', value: value.markdown }]
  if (Array.isArray(value)) return value.flatMap(toValueNodes)
  throw new Error('An object has no Markdown form.')
}

function memberName(node: EstreeJsx.JSXMemberExpression): string {
  const object = node.object.type === 'JSXIdentifier' ? node.object.name : memberName(node.object)
  return `${object}.${node.property.name}`
}

/** Inline content of nodes: paragraphs and headings unwrap, other blocks keep their text. */
function phrasing(nodes: readonly MdAst.RootContent[]): MdAst.PhrasingContent[] {
  const result: MdAst.PhrasingContent[] = []
  for (const node of nodes) {
    let inline: MdAst.PhrasingContent[]
    if (phrasingTypes.has(node.type)) inline = [node as MdAst.PhrasingContent]
    else if (node.type === 'paragraph' || node.type === 'heading' || node.type === 'tableCell')
      inline = node.children
    else if ('children' in node) inline = phrasing(node.children as MdAst.RootContent[])
    else if ('value' in node) inline = [{ type: 'text', value: String(node.value) }]
    else inline = []
    if (!inline.length) continue
    if (result.length && !phrasingTypes.has(node.type)) result.push({ type: 'text', value: ' ' })
    result.push(...inline)
  }
  return result
}

/** Block content of nodes: runs of inline content become paragraphs, list items become lists. */
function flow(nodes: readonly MdAst.RootContent[]): MdAst.RootContent[] {
  const result: MdAst.RootContent[] = []
  let run: MdAst.PhrasingContent[] = []
  let items: MdAst.ListItem[] = []
  const flush = () => {
    if (run.some((node) => node.type !== 'html' && !(node.type === 'text' && !node.value.trim())))
      result.push({ type: 'paragraph', children: run })
    else result.push(...run.filter((node) => node.type === 'html'))
    run = []
    if (items.length) result.push({ type: 'list', ordered: false, spread: false, children: items })
    items = []
  }
  for (const node of nodes) {
    if (node.type === 'listItem') {
      if (run.length) flush()
      items.push(node)
    } else if (phrasingTypes.has(node.type)) {
      if (items.length) flush()
      run.push(node as MdAst.PhrasingContent)
    } else {
      flush()
      result.push(node)
    }
  }
  flush()
  return result
}

function text(value: unknown): MdAst.Text[] {
  return typeof value === 'string' && value ? [{ type: 'text', value }] : []
}

function link(url: unknown, label: MdAst.PhrasingContent[]): MdAst.Link[] {
  return typeof url === 'string' && url ? [{ type: 'link', url, children: label }] : []
}

/** Lowers an intrinsic HTML element to Markdown nodes, or `undefined` when it has no form. */
function lower(
  name: string | null,
  props: Props,
  children: MdAst.RootContent[],
): MdAst.RootContent[] | undefined {
  switch (name) {
    case 'a': {
      if (typeof props['href'] !== 'string') return children
      const blocks = flow(children)
      if (blocks.length <= 1) return link(props['href'], phrasing(children))
      // A link around blocks, such as a card: its heading (or first paragraph) links.
      const at = Math.max(
        0,
        blocks.findIndex((block) => block.type === 'heading'),
      )
      return blocks.map((block, index) =>
        index === at && (block.type === 'heading' || block.type === 'paragraph')
          ? { ...block, children: link(props['href'], block.children) }
          : block,
      )
    }
    case 'img':
      return typeof props['src'] === 'string'
        ? [
            {
              type: 'image',
              url: props['src'],
              alt: typeof props['alt'] === 'string' ? props['alt'] : '',
              title: typeof props['title'] === 'string' ? props['title'] : null,
            },
          ]
        : []
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
    case 'h5':
    case 'h6':
      return [
        {
          type: 'heading',
          depth: Number(name[1]) as MdAst.Heading['depth'],
          children: phrasing(children),
        },
      ]
    case 'p':
      return [{ type: 'paragraph', children: phrasing(children) }]
    case 'br':
      return [{ type: 'break' }]
    case 'hr':
      return [{ type: 'thematicBreak' }]
    case 'em':
    case 'i':
      return [{ type: 'emphasis', children: phrasing(children) }]
    case 'strong':
    case 'b':
      return [{ type: 'strong', children: phrasing(children) }]
    case 'del':
    case 's':
      return [{ type: 'delete', children: phrasing(children) }]
    case 'code':
    case 'kbd':
      return [{ type: 'inlineCode', value: children.map((node) => nodeToString(node)).join('') }]
    case 'pre':
      return [{ type: 'code', value: children.map((node) => nodeToString(node)).join('\n') }]
    case 'blockquote':
      return [{ type: 'blockquote', children: flow(children) as MdAst.BlockContent[] }]
    case 'summary':
      return [{ type: 'paragraph', children: [{ type: 'strong', children: phrasing(children) }] }]
    case 'ul':
    case 'ol':
      return [
        {
          type: 'list',
          ordered: name === 'ol',
          // `<ol start={5}>` or `start="5"` continues an earlier list's numbering.
          start:
            name === 'ol' && Number.isInteger(Number(props['start']))
              ? Number(props['start'])
              : null,
          spread: false,
          children: children.flatMap((child): MdAst.ListItem[] => {
            if (child.type === 'listItem') return [child]
            if (child.type === 'list') return child.children
            if (child.type === 'text' && !child.value.trim()) return []
            return [{ type: 'listItem', spread: false, children: flow([child]) as never }]
          }),
        },
      ]
    case 'li':
      return [{ type: 'listItem', spread: false, children: flow(children) as never }]
    case 'table': {
      const rows = children.flatMap(function collect(node): MdAst.TableRow[] {
        if (node.type === 'tableRow') return [node]
        return 'children' in node ? (node.children as MdAst.RootContent[]).flatMap(collect) : []
      })
      if (!rows.length) return []
      const width = Math.max(...rows.map((row) => row.children.length))
      return [{ type: 'table', align: Array(width).fill(null), children: rows }]
    }
    case 'thead':
    case 'tbody':
    case 'tfoot':
      return children.filter((child) => child.type === 'tableRow')
    case 'tr':
      return [
        {
          type: 'tableRow',
          children: children.flatMap((child): MdAst.TableCell[] => {
            if (child.type === 'tableCell') return [child]
            if (child.type === 'text' && !child.value.trim()) return []
            return [{ type: 'tableCell', children: phrasing([child]) }]
          }),
        },
      ]
    case 'th':
    case 'td':
      return [{ type: 'tableCell', children: phrasing(children) }]
    case 'iframe':
      return link(props['src'], text(props['title'] ?? 'Watch video'))
    case 'video':
    case 'audio':
      return typeof props['src'] === 'string'
        ? link(props['src'], text(props['title'] ?? `Watch ${name}`))
        : children
    case 'source':
      return link(props['src'], text('Watch video'))
    case 'abbr':
    case 'article':
    case 'aside':
    case 'center':
    case 'details':
    case 'div':
    case 'figcaption':
    case 'figure':
    case 'footer':
    case 'header':
    case 'main':
    case 'mark':
    case 'nav':
    case 'picture':
    case 'section':
    case 'small':
    case 'span':
    case 'sub':
    case 'sup':
    case 'u':
    case null:
      return children
    default:
      return undefined
  }
}
