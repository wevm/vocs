/**
 * Blocks are the typed parts of a generated page. The agent emits them one at a time through the
 * page tools, and `parse` rejects any block that does not match `schema.block`, with a message the
 * agent reads to fix it. Text fields hold inline Markdown: paragraphs, `-` lists, `code`, `**bold**`,
 * `*emphasis*`, and `[links](https://…)`. Raw HTML is never rendered.
 * @module
 */
import * as z from 'zod/mini'
import { en } from 'zod/locales'

/** One block of a page. */
export type Block = schema.Block

/**
 * A block as a page holds it. Code carries `html`, the highlighted HTML inside `<code>` that the
 * render route returned. A diagram of a saved page carries `svg`, which the handler rendered on
 * save. The model never sets either: `parse` drops unknown fields.
 */
export type Rendered =
  | Exclude<Block, { type: 'code' | 'codeGroup' | 'mermaid' }>
  | (schema.Code & Html)
  | (Extract<Block, { type: 'mermaid' }> & {
      /** SVG of the diagram, from the handler. */
      svg?: string | undefined
    })
  | (Omit<schema.CodeGroup, 'tabs'> & {
      tabs: readonly (schema.CodeGroup['tabs'][number] & Html)[]
    })

/** The block type names, such as `callout`. */
export type Type = Block['type']

type Html = {
  /** Highlighted HTML inside `<code>`, from the render route. */
  html?: string | undefined
}

/**
 * Validates a block.
 *
 * @throws {Block.InvalidError} When the value is not a block. The message lists each fault.
 */
export function parse(value: unknown): Block {
  const result = z.safeParse(schema.block, value, { error: en().localeError })
  if (result.success) return result.data
  throw new InvalidError(z.prettifyError(result.error))
}

/** Thrown when a value is not a block. */
export class InvalidError extends Error {
  override name = 'Block.InvalidError'
  constructor(faults: string) {
    super(`The block is invalid. Fix these fields and emit it again:\n${faults}`)
  }
}

export namespace schema {
  const markdown = z.string().check(z.minLength(1), z.describe('Inline Markdown.'))
  const text = z.string().check(z.minLength(1))
  const code = z.string().check(z.minLength(1), z.describe('Source code, without fences.'))
  const twoslash = z.optional(
    z
      .boolean()
      .check(
        z.describe(
          'Type-checks a `ts` or `tsx` snippet and shows types on hover. Mark a query with `//    ^?` under the identifier.',
        ),
      ),
  )
  const lang = z
    .string()
    .check(
      z.regex(/^[a-z0-9+#-]+$/),
      z.describe('Language for highlighting, such as `ts` or `bash`.'),
    )

  export const callout = z.object({
    body: markdown,
    kind: z.enum(['danger', 'note', 'tip', 'warning']),
    title: z.optional(text),
    type: z.literal('callout'),
  })

  export const cards = z.object({
    cards: z
      .array(
        z.object({
          description: markdown,
          href: z.optional(z.url({ protocol: /^https?$/ })),
          title: text,
        }),
      )
      .check(z.minLength(1)),
    type: z.literal('cards'),
  })

  export const codeBlock = z.object({
    code,
    lang,
    title: z.optional(text.check(z.describe('File name or caption, such as `app/page.tsx`.'))),
    twoslash,
    type: z.literal('code'),
  })

  export const codeGroup = z.object({
    tabs: z
      .array(z.object({ code, lang, title: text, twoslash }))
      .check(
        z.minLength(2),
        z.describe('Alternatives of one snippet, such as npm, pnpm, and bun.'),
      ),
    type: z.literal('codeGroup'),
  })

  export const demo = z.object({
    name: text.check(z.describe('Name of a demo component the site registered.')),
    props: z.optional(
      z
        .record(z.string(), z.json())
        .check(z.describe('Props of the demo, which match its props schema in the instructions.')),
    ),
    type: z.literal('demo'),
  })

  export const fileTree = z.object({
    entries: z
      .array(
        z.object({
          note: z.optional(text),
          path: text.check(z.describe('Path from the project root, such as `src/app/page.tsx`.')),
        }),
      )
      .check(z.minLength(1)),
    type: z.literal('fileTree'),
  })

  export const heading = z.object({
    level: z.union([z.literal(2), z.literal(3)]),
    text,
    type: z.literal('heading'),
  })

  export const mermaid = z.object({
    diagram: text.check(z.describe('Mermaid source, such as `flowchart LR`.')),
    type: z.literal('mermaid'),
  })

  export const prose = z.object({
    markdown,
    type: z.literal('prose'),
  })

  export const steps = z.object({
    steps: z.array(z.object({ body: markdown, title: text })).check(z.minLength(1)),
    type: z.literal('steps'),
  })

  export const terminal = z.object({
    commands: z
      .array(z.object({ command: text, output: z.optional(z.string()) }))
      .check(z.minLength(1)),
    type: z.literal('terminal'),
  })

  export const block = z.discriminatedUnion('type', [
    callout,
    cards,
    codeBlock,
    codeGroup,
    demo,
    fileTree,
    heading,
    mermaid,
    prose,
    steps,
    terminal,
  ])

  export type Block = z.infer<typeof block>
  export type Code = z.infer<typeof codeBlock>
  export type CodeGroup = z.infer<typeof codeGroup>
}
