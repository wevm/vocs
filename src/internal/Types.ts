/**
 * Builds the type snapshot that Twoslash code blocks check against. The build compiles a probe
 * file that imports each configured package from the host's `node_modules`, records every file
 * TypeScript reads, and lays the files out as one flat virtual `node_modules` tree. The render
 * route mounts the snapshot, so it never fetches types at render time. Runs in Node only.
 * @module
 */
import * as Fs from 'node:fs'
import * as Path from 'node:path'
import ts from 'typescript-api'
import * as Highlight from './Highlight.js'

/** Type files keyed by virtual path, such as `/node_modules/viem/_types/index.d.ts`. */
export type Snapshot = {
  files: Record<string, string>
  /** SHA-256 of the files, which changes when any file changes. */
  hash: string
}

/**
 * Reads the type files of `packages` from the host's `node_modules`.
 *
 * @throws {Types.UnresolvedPackageError} When a package or one of its types does not resolve.
 */
export async function snapshot(options: snapshot.Options): Promise<Snapshot> {
  const compilerOptions = { ...Highlight.compilerOptions(ts), noEmit: true, skipLibCheck: true }
  const probe = Path.join(options.root, '__vocs_types__.ts')
  const source = options.packages
    .map((name, index) => `import * as p${index} from ${JSON.stringify(name)}\np${index}`)
    .join('\n')

  const reads = new Set<string>()
  const host = ts.createCompilerHost(compilerOptions)
  const { fileExists, getSourceFile, readFile } = host
  host.fileExists = (file) => file === probe || fileExists(file)
  host.getSourceFile = (file, language, ...rest) =>
    file === probe
      ? ts.createSourceFile(file, source, language)
      : getSourceFile(file, language, ...rest)
  host.readFile = (file) => {
    const text = readFile(file)
    if (text !== undefined) reads.add(Fs.realpathSync(file))
    return text
  }

  const program = ts.createProgram([probe], compilerOptions, host)
  const unresolved = ts
    .getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file?.fileName === probe)
  if (unresolved.length > 0)
    throw new UnresolvedPackageError({
      message: ts.flattenDiagnosticMessageText(unresolved[0]!.messageText, '\n'),
      root: options.root,
    })

  const libDirectory = Fs.realpathSync(Path.dirname(ts.getDefaultLibFilePath(compilerOptions)))
  const packages = new Map<string, string>()
  const libs: string[] = []
  for (const file of reads) {
    if (Path.dirname(file) === libDirectory) {
      libs.push(file)
      continue
    }
    const match = file.match(/^(.*\/node_modules\/((?:@[^/]+\/)?[^/]+))\//)
    if (match) packages.set(match[1]!, match[2]!)
  }

  const places = layout({ packages, root: options.root, top: options.packages })
  const files: Record<string, string> = {}
  for (const file of libs) files[`/${Path.basename(file)}`] = Fs.readFileSync(file, 'utf8')
  for (const file of [...reads].sort()) {
    const match = file.match(/^(.*\/node_modules\/(?:@[^/]+\/)?[^/]+)(\/.*)$/)
    const place = match && places.get(match[1]!)
    if (place) files[`${place}${match[2]}`] = Fs.readFileSync(file, 'utf8')
  }

  const bytes = new TextEncoder().encode(JSON.stringify(Object.entries(files).sort()))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return { files, hash: Buffer.from(digest).toString('hex').slice(0, 16) }
}

export declare namespace snapshot {
  type Options = {
    /** Package specifiers that code blocks import, such as `viem` or `viem/tempo`. */
    packages: readonly string[]
    /** Directory whose `node_modules` holds the packages. */
    root: string
  }
}

/** Thrown when a configured package or its types do not resolve from the host. */
export class UnresolvedPackageError extends Error {
  override name = 'Types.UnresolvedPackageError'
  constructor(options: { message: string; root: string }) {
    super(
      `A Twoslash package does not resolve from ${options.root}: ${options.message} Install the package, or remove it from \`twoslash.packages\`.`,
    )
  }
}

/**
 * Places each package directory in a virtual `node_modules` tree, so Node resolution in the tree
 * finds the same directory it finds on disk. A package goes to the top level, unless another
 * version is already on its resolution path. Then it nests under the package that imports it.
 * Disk layouts with symlinks, such as pnpm's, become plain directories.
 */
function layout(options: {
  packages: Map<string, string>
  root: string
  top: readonly string[]
}): Map<string, string> {
  const places = new Map<string, string>()
  const occupied = new Map<string, string>()

  function place(directory: string, parent: string) {
    const name = options.packages.get(directory)!
    let candidate = parent
    for (;;) {
      const found = occupied.get(`${candidate}/node_modules/${name}`)
      if (found === directory) return
      if (found !== undefined) {
        assign(`${parent}/node_modules/${name}`, directory)
        return
      }
      if (candidate === '') break
      candidate = candidate.slice(0, candidate.lastIndexOf('/node_modules/'))
    }
    assign(`/node_modules/${name}`, directory)
  }

  function assign(virtual: string, directory: string) {
    occupied.set(virtual, directory)
    if (places.has(directory)) return
    places.set(directory, virtual)
    for (const [dependency] of options.packages) {
      if (dependency === directory) continue
      if (resolve(directory, options.packages.get(dependency)!) === dependency)
        place(dependency, virtual)
    }
  }

  for (const specifier of options.top) {
    const name = specifier.match(/^(?:@[^/]+\/)?[^/]+/)![0]
    const directory = resolve(options.root, name)
    if (directory && options.packages.has(directory)) place(directory, '')
  }
  return places
}

/** Returns the real directory that Node resolution finds for `name` from `from`, if any. */
function resolve(from: string, name: string): string | undefined {
  let directory = from
  for (;;) {
    const candidate = Path.join(directory, 'node_modules', name)
    if (Fs.existsSync(Path.join(candidate, 'package.json'))) return Fs.realpathSync(candidate)
    const parent = Path.dirname(directory)
    if (parent === directory) return undefined
    directory = parent
  }
}
