/**
 * Saved pages: the pages a reader keeps, stored as one JSON value under a permalink ID. The handler
 * validates each draft with `parse`, which drops fields the reader's page must not set, such as the
 * `html` of code blocks. The handler renders that HTML again before it stores the page.
 * @module
 */
import * as z from 'zod/mini'
import { en } from 'zod/locales'
import * as Block from '../Block.js'

/** A saved set of pages, read from storage. */
export type Saved = {
  /** Corpus files the agent read, in first-read order. */
  files: readonly File[]
  /** Permalink ID, such as `attach-a-memo-k3f9a2`. */
  id: string
  /** Pages in sidebar order. */
  pages: readonly Page[]
}

/** A file the agent read, with its origin URL when the source reports one. */
export type File = { path: string; url?: string | undefined }

/** One saved page. */
export type Page = {
  blocks: readonly Block.Rendered[]
  /** Sidebar group, such as "Clients & Transports". */
  group: string
  /** URL segment, unique in the set, such as `set-up-a-client`. */
  slug: string
  /** Sidebar title, such as "Set Up a Client". */
  title: string
}

/** A set of pages to save, before the handler assigns an ID and renders code. */
export type Draft = schema.Draft

/** The pattern of permalink IDs and page slugs. */
export const segment = /^[a-z0-9][a-z0-9-]{0,79}$/

/**
 * Validates a draft.
 *
 * @throws {Saved.InvalidError} When the value is not a draft. The message lists each fault.
 */
export function parse(value: unknown): Draft {
  const result = z.safeParse(schema.draft, value, { error: en().localeError })
  if (!result.success) throw new InvalidError(z.prettifyError(result.error))
  const slugs = new Set(result.data.pages.map((page) => page.slug))
  if (slugs.size !== result.data.pages.length)
    throw new InvalidError('Two pages share a slug. Give each page a unique `slug`.')
  return result.data
}

/** Thrown when a draft is invalid. */
export class InvalidError extends Error {
  override name = 'Saved.InvalidError'
  constructor(faults: string) {
    super(`The pages are invalid:\n${faults}`)
  }
}

export namespace schema {
  const text = z.string().check(z.minLength(1), z.maxLength(200))

  export const draft = z.object({
    files: z
      .array(
        z.object({
          path: z.string().check(z.startsWith('/sources/'), z.maxLength(500)),
          url: z.optional(z.url({ protocol: /^https?$/ })),
        }),
      )
      .check(z.maxLength(200)),
    pages: z
      .array(
        z.object({
          blocks: z.array(Block.schema.block).check(z.maxLength(200)),
          group: text,
          slug: z.string().check(z.regex(segment)),
          title: text,
        }),
      )
      .check(z.minLength(1), z.maxLength(16)),
  })

  export type Draft = z.infer<typeof draft>
}
