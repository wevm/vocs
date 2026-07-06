import * as fs from 'node:fs'
import * as path from 'node:path'
import type * as MdAst from 'mdast'
import type * as React from 'react'
import * as Changelog from './changelog.js'
import type * as Config from './config.js'

/** A markdown leaf directive (`::name{key=value}`) with a representation per output pipeline. */
export type Directive = {
  /** Directive name — matches `::name` in markdown. */
  name: string
  /**
   * React representation — rendered in the site build with the directive's
   * attributes as props.
   */
  component?: React.ComponentType<Attributes> | undefined
  /**
   * Markdown representation — rendered in markdown output (`llms.txt`, `.md`
   * twins). Return markdown text or mdast nodes, or `null` to leave the
   * directive as-is. Thrown errors degrade to an HTML comment.
   */
  toMarkdown?:
    | ((attributes: Attributes) => toMarkdown.ReturnType | Promise<toMarkdown.ReturnType>)
    | undefined
}

/** Attributes parsed from the directive (`{key=value}`). */
export type Attributes = Record<string, string | null | undefined>

export declare namespace toMarkdown {
  type ReturnType = string | MdAst.RootContent[] | null | undefined
}

/**
 * Loads user directives from `{pagesDir}/_directives.tsx` (a `directives`
 * named export — a default export would register as a page) for the remark
 * pipelines. The react pipeline consumes the same file through
 * `virtual:vocs/directives` instead.
 */
export async function load(options: load.Options): Promise<load.ReturnType> {
  const { config } = options
  const { rootDir, srcDir, pagesDir } = config

  const file = path.resolve(rootDir, srcDir, pagesDir, '_directives.tsx')
  if (!fs.existsSync(file)) return []

  const { tsImport } = await import('tsx/esm/api')
  const loaded = (await tsImport(file, import.meta.url)) as {
    directives?: Directive[] | undefined
    default?: { directives?: Directive[] | undefined } | undefined
  }
  // CJS interop (no `"type": "module"`) nests the exports under `default`.
  return loaded.directives ?? loaded.default?.directives ?? []
}

export declare namespace load {
  type Options = {
    config: Pick<Config.Config, 'rootDir' | 'srcDir' | 'pagesDir'>
  }
  type ReturnType = readonly Directive[]
}

/** Resolves the directive registry: user directives first (they override built-ins), then built-ins. */
export function resolve(options: resolve.Options): resolve.ReturnType {
  const { config, directives = [] } = options
  return [...directives, ...builtins(config)]
}

export declare namespace resolve {
  type Options = {
    config: Pick<Config.Config, 'changelog'>
    /** User directives (`Directive.load`). */
    directives?: readonly Directive[] | undefined
  }
  type ReturnType = readonly Resolved[]
}

/** A registry entry: a user directive, or a built-in whose component is dispatched in `vocs/mdx`. */
export type Resolved = Directive & { builtin?: boolean | undefined }

/**
 * Built-in directives. Components live in `vocs/mdx` (`Directive.mdx.tsx`);
 * the `builtin` flag stands in for `component` at build time.
 */
function builtins(config: resolve.Options['config']): readonly Resolved[] {
  return [{ ...Changelog.directive({ adapter: config.changelog }), builtin: true }]
}
