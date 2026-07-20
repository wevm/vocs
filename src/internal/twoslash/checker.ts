import * as path from 'node:path'
import {
  defaultCompilerOptions,
  defaultHandbookOptions,
  findFlagNotations,
  getObjectHash,
  type TS,
  type TwoslashOptions,
} from 'twoslash/core'
import type * as TypeScript from 'typescript'
import * as TypeScriptLoader from './typescript.js'

const filenameRegex = /^[\t\v\f ]*\/\/\s?@filename: (.+)$/gm
const supportedExtensions = new Set(['js', 'jsx', 'json', 'ts', 'tsx'])

const pendingSnippets = new Map<string, collect.Snippet>()
const checkedSnippetKeys = new Set<string>()

export function collect(snippet: collect.Snippet) {
  const key = getObjectHash({
    code: snippet.code,
    customTags: snippet.twoslashOptions?.customTags,
    extraFiles: snippet.twoslashOptions?.extraFiles,
    handbookOptions: snippet.twoslashOptions?.handbookOptions,
    compilerOptions: snippet.twoslashOptions?.compilerOptions,
    lang: snippet.lang,
    meta: snippet.meta,
    throws: snippet.throws,
  })
  if (checkedSnippetKeys.has(key)) return
  pendingSnippets.set(key, snippet)
}

export declare namespace collect {
  type Snippet = {
    code: string
    lang: string
    meta?: string | undefined
    throws?: boolean | undefined
    twoslashOptions?: TwoslashOptions | undefined
  }
}

export function check(): check.Error[] {
  const snippets = Array.from(pendingSnippets, ([key, snippet]) => ({ key, snippet }))
  pendingSnippets.clear()

  if (snippets.length === 0) return []

  const errors: check.Error[] = []
  const groups = new Map<string, Group>()

  for (const { key, snippet } of snippets) {
    checkedSnippetKeys.add(key)
    if (snippet.throws === false) continue

    const tsModule = snippet.twoslashOptions?.tsModule ?? getTypeScript()
    const parsed = parseSnippet(snippet, tsModule, key)

    errors.push(...parsed.errors)
    if (parsed.errors.length > 0 || parsed.handbookOptions.noErrors === true) continue

    const groupKey = getObjectHash(parsed.compilerOptions)
    const group =
      groups.get(groupKey) ??
      ({
        compilerOptions: parsed.compilerOptions,
        files: new Map(),
        rootNames: [] as string[],
        snippets: new Map(),
        tsModule,
      } satisfies Group)
    groups.set(groupKey, group)

    const snippetRoot = path.join(getVirtualRoot(parsed.vfsRoot), key)
    const files = splitFiles(parsed.code, getDefaultFileName(parsed.lang))
    for (const file of files) {
      if (!supportedExtensions.has(file.extension)) continue

      const filePath = path.join(snippetRoot, sanitizeFileName(file.filename))
      const extra = parsed.twoslashOptions?.extraFiles?.[file.filename]
      const content =
        typeof extra === 'object'
          ? `${extra.prepend ?? ''}${file.content}${extra.append ?? ''}`
          : file.content

      const source = {
        content,
        filename: file.filename,
        offset: file.offset,
        snippet: parsed,
      } satisfies SourceFile

      group.files.set(normalizePath(filePath), source)
      group.rootNames.push(filePath)
      group.snippets.set(parsed.key, parsed)
    }

    for (const [fileName, extra] of Object.entries(parsed.twoslashOptions?.extraFiles ?? {})) {
      const filePath = path.join(snippetRoot, sanitizeFileName(fileName))
      const content =
        typeof extra === 'string' ? extra : `${extra.prepend ?? ''}${extra.append ?? ''}`
      group.files.set(normalizePath(filePath), {
        content,
        filename: fileName,
        offset: 0,
        snippet: parsed,
      })
      group.rootNames.push(filePath)
    }
  }

  for (const group of groups.values()) errors.push(...checkGroup(group))
  return errors
}

export declare namespace check {
  type Error = {
    code: string
    lang: string
    message: string
    meta?: string | undefined
  }
}

export function reset() {
  checkedSnippetKeys.clear()
  pendingSnippets.clear()
}

type ParsedSnippet = collect.Snippet & {
  compilerOptions: TypeScript.CompilerOptions
  errors: check.Error[]
  handbookOptions: typeof defaultHandbookOptions
  key: string
  tsModule: TS
  vfsRoot: string
}

type Group = {
  compilerOptions: TypeScript.CompilerOptions
  files: Map<string, SourceFile>
  rootNames: string[]
  snippets: Map<string, ParsedSnippet>
  tsModule: TS
}

type SourceFile = {
  content: string
  filename: string
  offset: number
  snippet: ParsedSnippet
}

type VirtualFile = {
  content: string
  extension: string
  filename: string
  offset: number
}

function parseSnippet(snippet: collect.Snippet, tsModule: TS, key: string): ParsedSnippet {
  const vfsRoot = snippet.twoslashOptions?.vfsRoot ?? process.cwd()
  const compilerOptions = {
    ...defaultCompilerOptions,
    baseUrl: `${vfsRoot.replace(/\\/g, '/')}/`,
    ignoreDeprecations: Number.parseInt(tsModule.versionMajorMinor, 10) >= 6 ? '6.0' : '5.0',
    moduleResolution: 100,
    preserveSymlinks: false,
    // Skip checking lib + .d.ts files. Twoslash snippets aren't authoring
    // libraries — we only want errors inside the snippet itself. Avoids
    // walking every lib.*.d.ts / @types/* AST per Program.
    skipDefaultLibCheck: true,
    skipLibCheck: true,
    types: ['node'],
    ...(snippet.twoslashOptions?.compilerOptions ?? {}),
  } satisfies TypeScript.CompilerOptions
  const handbookOptions = {
    ...defaultHandbookOptions,
    ...(snippet.twoslashOptions?.handbookOptions ?? {}),
  }

  const flagNotations = findFlagNotations(
    snippet.code,
    snippet.twoslashOptions?.customTags ?? [],
    getCompilerOptionDeclarations(tsModule),
  )
  for (const flag of flagNotations) {
    if (flag.type === 'compilerOptions') {
      ;(compilerOptions as Record<string, unknown>)[flag.name] = flag.value
      continue
    }
    if (flag.type === 'handbookOptions') {
      handbookOptions[flag.name as keyof typeof handbookOptions] = flag.value as never
    }
  }
  if (isJsxLanguage(snippet.lang) && compilerOptions.jsx === undefined) {
    compilerOptions.jsx = tsModule.JsxEmit.Preserve
  }

  const errors: check.Error[] = []
  const unknownFlags = flagNotations.filter((flag) => flag.type === 'unknown')
  if (!handbookOptions.noErrorValidation && unknownFlags.length > 0) {
    errors.push({
      code: snippet.code,
      lang: snippet.lang,
      message:
        `Unknown inline compiler flags\n` +
        `The following flags are neither valid TSConfig nor handbook options:\n` +
        unknownFlags.map((flag) => `@${flag.name}`).join(', '),
      meta: snippet.meta,
    })
  }

  return {
    ...snippet,
    compilerOptions,
    errors,
    handbookOptions,
    key,
    tsModule,
    vfsRoot,
  }
}

function checkGroup(group: Group): check.Error[] {
  const tsModule = group.tsModule
  const host = createCompilerHost(group)
  const program = tsModule.createProgram(group.rootNames, group.compilerOptions, host)

  const diagnosticsBySnippet = new Map<string, Diagnostic[]>()
  for (const rootName of group.rootNames) {
    const sourceFile = program.getSourceFile(rootName)
    if (!sourceFile) continue
    const diagnostics = [
      ...program.getSyntacticDiagnostics(sourceFile),
      ...program.getSemanticDiagnostics(sourceFile),
    ]
    for (const diagnostic of diagnostics) {
      if (!diagnostic.file) continue

      const source = group.files.get(normalizePath(diagnostic.file.fileName))
      if (!source) continue

      const snippetDiagnostics = diagnosticsBySnippet.get(source.snippet.key) ?? []
      snippetDiagnostics.push({ diagnostic, source })
      diagnosticsBySnippet.set(source.snippet.key, snippetDiagnostics)
    }
  }

  const errors: check.Error[] = []
  for (const [key, diagnostics] of diagnosticsBySnippet) {
    const snippet = group.snippets.get(key)
    if (!snippet || snippet.handbookOptions.noErrorValidation) continue

    const ignoredCodes = Array.isArray(snippet.handbookOptions.noErrors)
      ? snippet.handbookOptions.noErrors
      : []
    const relevantDiagnostics = diagnostics.filter(({ diagnostic }) => {
      const code = diagnostic.code
      if (ignoredCodes.includes(code)) return false
      return true
    })
    const unspecifiedDiagnostics = relevantDiagnostics.filter(
      ({ diagnostic }) => !snippet.handbookOptions.errors.includes(diagnostic.code),
    )

    if (unspecifiedDiagnostics.length === 0) continue

    const codes = Array.from(
      new Set(unspecifiedDiagnostics.map(({ diagnostic }) => diagnostic.code)),
    )
    const codesText = codes.join(' ')
    const missing = snippet.handbookOptions.errors.length
      ? `The existing annotation specified ${snippet.handbookOptions.errors.join(' ')}`
      : `Expected: // @errors: ${codesText}`

    errors.push({
      code: snippet.code,
      lang: snippet.lang,
      message:
        `Errors were thrown in the sample, but not included in an error tag\n` +
        `These errors were not marked as being expected: ${codesText}.\n${missing}\n\n` +
        `Compiler Errors:\n\n${formatDiagnostics(tsModule, relevantDiagnostics)}`,
      meta: snippet.meta,
    })
  }

  return errors
}

type Diagnostic = {
  diagnostic: TypeScript.Diagnostic
  source: SourceFile
}

function createCompilerHost(group: Group): TypeScript.CompilerHost {
  const tsModule = group.tsModule
  const host = tsModule.createCompilerHost(group.compilerOptions, true)
  const directories = getDirectories(group.files)

  return {
    ...host,
    directoryExists(directory) {
      if (directories.has(normalizePath(directory))) return true
      return host.directoryExists?.(directory) ?? false
    },
    fileExists(fileName) {
      if (group.files.has(normalizePath(fileName))) return true
      return host.fileExists(fileName)
    },
    getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile) {
      const source = group.files.get(normalizePath(fileName))
      if (source) return tsModule.createSourceFile(fileName, source.content, languageVersion, true)
      return host.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile)
    },
    readFile(fileName) {
      const source = group.files.get(normalizePath(fileName))
      if (source) return source.content
      return host.readFile(fileName)
    },
  }
}

function formatDiagnostics(tsModule: TS, diagnostics: Diagnostic[]): string {
  const lines: string[] = []
  const byFile = Map.groupBy(diagnostics, ({ source }) => source.filename)

  for (const [fileName, fileDiagnostics] of byFile) {
    lines.push(fileName)
    for (const { diagnostic, source } of fileDiagnostics) {
      const start = (diagnostic.start ?? 0) + source.offset
      const message = tsModule.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
      lines.push(`  [${diagnostic.code}] ${start} - ${message}`)
    }
  }

  return lines.join('\n')
}

function splitFiles(code: string, defaultFileName: string): VirtualFile[] {
  const matches = Array.from(code.matchAll(filenameRegex))
  const allFilenames = matches.map((match) => match[1]?.trimEnd())
  let currentFileName = allFilenames.includes(defaultFileName) ? '__index__.ts' : defaultFileName
  const files: VirtualFile[] = []
  let index = 0

  for (const match of matches) {
    const offset = match.index
    const content = code.slice(index, offset)
    if (content) {
      files.push({
        content,
        extension: getExtension(currentFileName),
        filename: currentFileName,
        offset: index,
      })
    }
    currentFileName = match[1]?.trimEnd() ?? currentFileName
    index = offset
  }

  if (index < code.length) {
    files.push({
      content: code.slice(index),
      extension: getExtension(currentFileName),
      filename: currentFileName,
      offset: index,
    })
  }

  return files
}

function getDefaultFileName(lang: string): string {
  const extension =
    (
      {
        javascript: 'js',
        typescript: 'ts',
      } as Record<string, string>
    )[lang] ?? lang
  return `index.${extension}`
}

function getDirectories(files: Map<string, SourceFile>): Set<string> {
  const directories = new Set<string>()
  for (const filePath of files.keys()) {
    let directory = path.dirname(filePath)
    while (!directories.has(directory)) {
      directories.add(directory)
      const parent = path.dirname(directory)
      if (parent === directory) break
      directory = parent
    }
  }
  return directories
}

function getExtension(fileName: string): string {
  return fileName.split('.').pop() ?? ''
}

function getTypeScript(): TS {
  return TypeScriptLoader.fromProject()
}

function getCompilerOptionDeclarations(tsModule: TS): Parameters<typeof findFlagNotations>[2] {
  return (tsModule as TS & { optionDeclarations: Parameters<typeof findFlagNotations>[2] })
    .optionDeclarations
}

function getVirtualRoot(vfsRoot: string): string {
  return path.join(vfsRoot, '.vocs', 'twoslash-check')
}

function isJsxLanguage(lang: string): boolean {
  return lang === 'jsx' || lang === 'tsx'
}

function normalizePath(filePath: string): string {
  return path.normalize(filePath)
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .replace(/^(\.\.\/)+/g, '')
}
