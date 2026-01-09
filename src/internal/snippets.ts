import * as fs from 'node:fs'
import * as path from 'node:path'

const includeRegex = /\/\/ \[!include (.*)\]/
const regionStartRegex = /\/\/ \[!region (.*)\]/
const regionEndRegex = /\/\/ \[!endregion (.*)\]/
const regionStartLineGlobal = /\/\/ \[!region (.*)\]\n/g
const regionEndLineGlobal = /\/\/ \[!endregion (.*)\](\n|$)/g
const findReplaceRegex = /^\/(.*)([^\\])\/(.*)\/$/

/**
 * Processes `// [!include ...]` markers in code, replacing them with source content.
 * Optimized with early exit when no includes are present.
 */
export function processIncludes(options: processIncludes.Options): processIncludes.ReturnType {
  const { code, getSource } = options

  const hasIncludes = code.includes('// [!include')
  if (!hasIncludes) return stripRegionMarkers(code)

  const lines = code.split('\n')
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const match = line?.match(includeRegex)

    if (match) {
      const [, value] = match
      const [file, ...query] = value?.split(' ') ?? []
      const [fileName, region] = file?.split(':') ?? []

      if (!fileName) {
        i++
        continue
      }

      let contents = getSource(fileName)
      if (contents === undefined) {
        i++
        continue
      }

      contents = extractRegion({ code: contents, region })
      contents = findAndReplace({ code: contents, queries: query })

      lines.splice(i, 1, contents)
    }
    i++
  }

  return lines.join('\n').replace(/\n$/, '')
}

export declare namespace processIncludes {
  type Options = {
    code: string
    getSource: (fileName: string) => string | undefined
  }
  type ReturnType = string
}

/**
 * Extracts a named region from code, or strips all region markers if no region specified.
 */
export function extractRegion(options: extractRegion.Options): extractRegion.ReturnType {
  const { code, region } = options

  const lines: string[] = []
  let inRegion = !region

  for (const line of code.split('\n')) {
    const startMatch = line.match(regionStartRegex)
    const endMatch = line.match(regionEndRegex)

    if (inRegion && !startMatch && !endMatch) {
      lines.push(line)
    } else if (startMatch) {
      if (startMatch[1] === region) inRegion = true
    } else if (endMatch) {
      if (endMatch[1] === region) inRegion = false
    }
  }

  return lines.join('\n')
}

export declare namespace extractRegion {
  type Options = {
    code: string
    region: string | undefined
  }
  type ReturnType = string
}

/**
 * Applies find/replace patterns to code.
 * Pattern format: /find/replace/
 */
export function findAndReplace(options: findAndReplace.Options): findAndReplace.ReturnType {
  const { queries } = options
  if (queries.length === 0) return options.code

  let code = options.code

  for (const query of queries) {
    const match = query.match(findReplaceRegex)
    if (!match) continue

    const [, find1 = '', find2 = '', replace1 = ''] = match
    const find = (find1 + find2).replace('\\/', '/')
    const replace = replace1.replace('\\/', '/')
    code = code.replaceAll(find, replace)
  }

  return code
}

export declare namespace findAndReplace {
  type Options = {
    code: string
    queries: string[]
  }
  type ReturnType = string
}

/**
 * Strips region markers from code.
 */
function stripRegionMarkers(code: string): string {
  return code
    .replaceAll(regionStartLineGlobal, '')
    .replaceAll(regionEndLineGlobal, '')
    .replace(/\n$/, '')
}

/**
 * Creates a source getter for physical files (files on disk).
 * Uses `~` prefix to indicate root-relative paths.
 */
export function createPhysicalSourceGetter(
  options: createPhysicalSourceGetter.Options,
): createPhysicalSourceGetter.ReturnType {
  const { srcDir, rootDir } = options
  const cache = new Map<string, string>()

  return (fileName: string) => {
    if (!fileName.startsWith('~')) return undefined

    const cached = cache.get(fileName)
    if (cached !== undefined) return cached

    const filePath = path.resolve(rootDir, srcDir, fileName.replace('~', '.'))
    try {
      const content = fs.readFileSync(filePath, 'utf-8').replace(/\n$/, '')
      cache.set(fileName, content)
      return content
    } catch {
      return undefined
    }
  }
}

export declare namespace createPhysicalSourceGetter {
  type Options = { srcDir: string; rootDir: string }
  type ReturnType = (fileName: string) => string | undefined
}

/**
 * Creates a source getter for virtual files (defined inline in MDX).
 */
export function createVirtualSourceGetter(
  options: createVirtualSourceGetter.Options,
): createVirtualSourceGetter.ReturnType {
  const { virtualFiles } = options

  return (fileName: string) => {
    if (fileName.startsWith('~')) return undefined
    return virtualFiles.get(fileName)
  }
}

export declare namespace createVirtualSourceGetter {
  type Options = { virtualFiles: Map<string, string> }
  type ReturnType = (fileName: string) => string | undefined
}

/**
 * Combines multiple source getters into one.
 * Returns the first non-undefined result.
 */
export function combineSourceGetters(
  ...getters: Array<(fileName: string) => string | undefined>
): (fileName: string) => string | undefined {
  return (fileName: string) => {
    for (const getter of getters) {
      const result = getter(fileName)
      if (result !== undefined) return result
    }
    return undefined
  }
}

const importRegex = /from\s+['"]([^'"]+)['"]/g

/**
 * Processes imports in Twoslash code blocks to inject virtual file content.
 * Injects `@filename` directives so Twoslash can resolve imports from virtual files.
 */
export function processImports(options: processImports.Options): processImports.ReturnType {
  const { code, virtualFiles } = options
  const matches = [...code.matchAll(importRegex)]

  let result = code
  for (const match of matches) {
    const importPath = match[1]
    if (!importPath) continue
    const fileName = stripFilePath(importPath)

    for (const [virtualName, sourceCode] of virtualFiles) {
      if (stripFilePath(virtualName) !== fileName) continue

      const prefix = `// @filename: ${virtualName}\n${sourceCode}\n`
      const hasFilename = result.includes('@filename: example.ts')
      const main = hasFilename ? '' : '// @filename: example.ts\n// ---cut---\n'
      result = prefix + main + result
      break
    }
  }

  return result
}

export declare namespace processImports {
  type Options = {
    code: string
    virtualFiles: Map<string, string>
  }
  type ReturnType = string
}

function stripFilePath(fileName: string): string {
  return fileName.replace(/^\.\//, '').replace(/\.(ts|js|tsx|jsx)$/, '')
}
