/**
 * Sources are the content the agent reads. Every source implements one contract (`revision`,
 * `list`, `read`) so the corpus build can snapshot it and the handler can serve it at runtime.
 * Factories build the built-in sources: `files` for repository files and `github` for a
 * GitHub repository. `from` wraps a custom source.
 * @module
 */
import * as Glob from './internal/Glob.js'

/** A source the agent reads. */
export type Source = {
  /** Who authorizes runtime reads. `site` uses the site's credentials, `reader` uses the reader's. */
  auth: Auth
  /** Lists every file path in the source, relative to its root, such as `guides/memos.md`. */
  list(context: Context): Promise<readonly string[]>
  /** When the source is read. `snapshot` reads at build time, `runtime` reads on demand. */
  mode: Mode
  /** Unique name. Files mount at `/sources/<name>/`. */
  name: string
  /** Reads one file by its path from `list`. */
  read(path: string, context: Context): Promise<File>
  /** A value that changes when the content changes, such as a commit SHA. */
  revision(context: Context): Promise<string>
  /** Backend name, such as `github`. */
  type: string
  /** Whether a private source may reach readers' browsers. */
  visibility: Visibility
}

export type Auth = 'reader' | 'site'

/** Capabilities the caller provides to sources. */
export type Context = {
  /** Environment values and bindings, such as `GITHUB_TOKEN`. */
  env: Record<string, unknown>
  /** Repository files. The corpus build provides this in Node. */
  files?: Files | undefined
}

/** One file read from a source. */
export type File = {
  /** UTF-8 text content. */
  content: string
  /** Origin URL for citations, such as a GitHub permalink. */
  url?: string | undefined
}

/** Repository file access, provided by the build. Paths are relative to the project root. */
export type Files = {
  list(): Promise<readonly string[]>
  read(path: string): Promise<string>
}

export type Mode = 'runtime' | 'snapshot'

export type Visibility = 'private' | 'public'

/**
 * Repository files that match `include`, read at build time.
 *
 * @example
 * ```ts
 * Source.files({ include: 'docs/**\/*.md' })
 * ```
 */
export function files(options: files.Options): Source {
  const include = Glob.matcher(options.include)
  const exclude = Glob.matcher(options.exclude ?? [])
  const name = options.name ?? 'files'

  async function paths(context: Context) {
    if (!context.files) throw new MissingFilesError({ name })
    const all = await context.files.list()
    return all.filter((path) => include(path) && !exclude(path)).sort()
  }

  return {
    auth: 'site',
    async list(context) {
      return paths(context)
    },
    mode: 'snapshot',
    name,
    async read(path, context) {
      if (!context.files) throw new MissingFilesError({ name })
      return { content: await context.files.read(path) }
    },
    async revision(context) {
      const list = await paths(context)
      const contents = await Promise.all(list.map((path) => context.files!.read(path)))
      return digest(list.map((path, index) => `${path}\n${contents[index]}`).join('\n'))
    },
    type: 'files',
    visibility: 'public',
  }
}

export declare namespace files {
  type Options = {
    /** Patterns to leave out. */
    exclude?: string | readonly string[] | undefined
    /** Patterns relative to the project root, such as `docs/**\/*.md`. */
    include: string | readonly string[]
    /** Source name. Defaults to `files`. */
    name?: string | undefined
  }
}

/**
 * Files in a GitHub repository, pinned at the commit that `ref` resolves to when the corpus
 * builds. Reads `GITHUB_TOKEN` from the context when it is set.
 *
 * @example
 * ```ts
 * Source.github({ repo: 'tempoxyz/tempo', paths: ['tips/**'] })
 * ```
 */
export function github(options: github.Options): Source {
  const include = Glob.matcher(options.paths ?? '**')
  const ref = options.ref ?? 'HEAD'
  const name = options.name ?? options.repo.split('/')[1]!
  const commits = new Map<string, Promise<string>>()

  function headers(context: Context): Record<string, string> {
    const token = context.env.GITHUB_TOKEN
    return {
      accept: 'application/vnd.github+json',
      'user-agent': 'vocs',
      ...(typeof token === 'string' && token ? { authorization: `Bearer ${token}` } : {}),
    }
  }

  async function request<value>(path: string, context: Context): Promise<value> {
    const response = await fetch(`https://api.github.com/repos/${options.repo}${path}`, {
      headers: headers(context),
    })
    if (!response.ok)
      throw new GithubError({ name, path, repo: options.repo, status: response.status })
    return (await response.json()) as value
  }

  // One build resolves `ref` once, so every read uses the same commit.
  function commit(context: Context) {
    let sha = commits.get(ref)
    if (!sha) {
      sha = request<{ sha: string }>(`/commits/${ref}`, context).then((result) => result.sha)
      commits.set(ref, sha)
    }
    return sha
  }

  return {
    auth: 'site',
    async list(context) {
      const sha = await commit(context)
      const tree = await request<{ tree: readonly { path: string; type: string }[] }>(
        `/git/trees/${sha}?recursive=1`,
        context,
      )
      return tree.tree
        .filter((entry) => entry.type === 'blob' && include(entry.path))
        .map((entry) => entry.path)
        .sort()
    },
    mode: options.mode ?? 'snapshot',
    name,
    async read(path, context) {
      const sha = await commit(context)
      const response = await fetch(
        `https://raw.githubusercontent.com/${options.repo}/${sha}/${path}`,
        { headers: headers(context) },
      )
      if (!response.ok)
        throw new GithubError({ name, path, repo: options.repo, status: response.status })
      return {
        content: await response.text(),
        url: `https://github.com/${options.repo}/blob/${sha}/${path}`,
      }
    },
    revision: commit,
    type: 'github',
    visibility: options.visibility ?? 'public',
  }
}

export declare namespace github {
  type Options = {
    /** When the source is read. Defaults to `snapshot`. */
    mode?: Mode | undefined
    /** Source name. Defaults to the repository name. */
    name?: string | undefined
    /** Patterns of repository paths to include. Defaults to every file. */
    paths?: string | readonly string[] | undefined
    /** Branch, tag, or commit. Defaults to the default branch. */
    ref?: string | undefined
    /** Repository as `owner/name`. */
    repo: string
    /** Defaults to `public`. */
    visibility?: Visibility | undefined
  }
}

/** Wraps a custom source, filling the defaults of the optional fields. */
export function from(source: from.Options): Source {
  return {
    auth: 'site',
    mode: 'snapshot',
    type: 'custom',
    visibility: 'private',
    ...source,
  }
}

export declare namespace from {
  type Options = Pick<Source, 'list' | 'name' | 'read' | 'revision'> &
    Partial<Pick<Source, 'auth' | 'mode' | 'type' | 'visibility'>>
}

/** Returns the hex SHA-256 digest of a string. */
export async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

/** Thrown when GitHub refuses a request. */
export class GithubError extends Error {
  override name = 'Source.GithubError'
  constructor(options: { name: string; path: string; repo: string; status: number }) {
    super(
      `Source "${options.name}" could not read ${options.path} from ${options.repo} (HTTP ${options.status}). Check the repository and ref, or set GITHUB_TOKEN to raise the rate limit.`,
    )
  }
}

/** Thrown when a `files` source runs without repository file access. */
export class MissingFilesError extends Error {
  override name = 'Source.MissingFilesError'
  constructor(options: { name: string }) {
    super(
      `Source "${options.name}" reads repository files, but this context has none. Build the corpus with \`vocs corpus\` or the \`vocs()\` Vite plugin.`,
    )
  }
}
