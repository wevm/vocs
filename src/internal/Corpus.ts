/**
 * The corpus is every snapshot source's files in one content-addressed value, which the page
 * mounts at `/sources/<name>/<path>` for the agent to search. The build resolves each source's
 * revision, reads its files, and hashes the result, so a changed source changes the hash. The
 * `vocs()` plugin writes it as a static asset and attaches its `Asset` to the config it serves.
 * Internal: users configure sources and never handle a corpus.
 * @module
 */
import type * as Config from '../Config.js'
import * as Source from '../Source.js'

/** A built corpus. */
export type Corpus = {
  /** File contents keyed by mount path, such as `/sources/docs/guides/memos.md`. */
  files: Record<string, string>
  /** SHA-256 of the files, which changes when any file changes. */
  hash: string
  /** The sources in the corpus, in config order. */
  sources: readonly Summary[]
  /** Origin URLs keyed by mount path, for files whose source reports one. */
  urls: Record<string, string>
}

/** Where the page loads a built corpus. */
export type Asset = {
  hash: string
  /** Path of the static asset, such as `/assets/vocs-corpus-<hash>.json`. */
  url: string
}

/** Key of the `Asset` on a config served by `virtual:vocs/config`. */
export const key = Symbol.for('vocs.corpus')

/** Returns the corpus asset attached to a config, if the `vocs()` plugin built one. */
export function asset(config: Config.Config): Asset | undefined {
  return (config as Config.Config & { [key]?: Asset | undefined })[key]
}

/** One source in a corpus. */
export type Summary = {
  files: number
  name: string
  revision: string
  type: string
}

/** Number of files read at once from one source. */
const concurrency = 8

/**
 * Reads every snapshot source in the config into a corpus.
 *
 * @throws When a source fails to list or read. The error names the source.
 */
export async function build(options: build.Options): Promise<Corpus> {
  const sources = options.config.sources.filter((source) => source.mode === 'snapshot')

  const results = await Promise.all(
    sources.map(async (source) => {
      const [revision, paths] = await Promise.all([
        source.revision(options.context),
        source.list(options.context),
      ])
      if (paths.length === 0) throw new EmptySourceError({ name: source.name })

      const files: (readonly [string, Source.File])[] = []
      for (let index = 0; index < paths.length; index += concurrency) {
        const batch = paths.slice(index, index + concurrency)
        const read = await Promise.all(batch.map((path) => source.read(path, options.context)))
        for (const [offset, file] of read.entries()) files.push([batch[offset]!, file])
      }
      return { files, revision, source }
    }),
  )

  const files: Record<string, string> = {}
  const urls: Record<string, string> = {}
  for (const result of results)
    for (const [path, file] of result.files) {
      const mount = `/sources/${result.source.name}/${path}`
      files[mount] = file.content
      if (file.url) urls[mount] = file.url
    }

  const hash = await Source.digest(
    JSON.stringify(
      Object.keys(files)
        .sort()
        .map((path) => [path, files[path]]),
    ),
  )

  return {
    files,
    hash,
    sources: results.map((result) => ({
      files: result.files.length,
      name: result.source.name,
      revision: result.revision,
      type: result.source.type,
    })),
    urls,
  }
}

export declare namespace build {
  type Options = {
    config: Config.Config
    context: Source.Context
  }
}

/** Thrown when a snapshot source lists no files. */
export class EmptySourceError extends Error {
  override name = 'Corpus.EmptySourceError'
  constructor(options: { name: string }) {
    super(`Source "${options.name}" has no files. Check its include patterns or paths.`)
  }
}
