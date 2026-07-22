import { type HarRequest, snippetz } from '@scalar/snippetz'
import { mediaIdBase, responseIdBase, type SchemaPath, slug } from './anchors.js'
import type { IrMediaType, IrOperation, IrParameter } from './parser.js'
import { unionVariantSchemas, unionVariantSegment } from './union.js'

/**
 * A generated request code sample for a single client (e.g. cURL, JS fetch).
 *
 * `lang` is a Shiki language id so the React layer can highlight it with the
 * same highlighter used for the rest of the docs.
 */
export type CodeSample = {
  /**
   * Clickable spans within `display` that link to a parameter's documentation
   * row. Each `range` is a `[start, end]` character range into `display`; `id`
   * is the target element id. Used for path parameters, which sit inline within
   * the URL line, so only their value (not the whole line) is clickable.
   */
  anchors: { range: [number, number]; id: string }[]
  /** Generated source code, used verbatim for the copy-to-clipboard action. */
  code: string
  /**
   * Collapsed view shown by default when the request has more than 2 query
   * parameters: the same snippet rendered with only the first 2, plus its own
   * `anchors`/`lineAnchors`/`colorRanges` (line counts differ from the full
   * `display`). Absent when there is nothing to collapse.
   */
  collapsed?: {
    display: string
    anchors: { range: [number, number]; id: string }[]
    colorRanges: { range: [number, number]; kind: 'key' | 'value' }[]
    lineAnchors: (string | undefined)[]
  }
  /**
   * `[start, end]` character ranges within `display` to recolor so the URL reads
   * like the JSON response example: parameter names use the JSON-string color
   * (`'key'`) and parameter values the JSON-number color (`'value'`). Covers
   * query parameter names/values; path parameter values are colored via their
   * {@link anchors} entry instead (those already wrap the value).
   */
  colorRanges: { range: [number, number]; kind: 'key' | 'value' }[]
  /**
   * Display variant of {@link code} with each query parameter placed on its own
   * line for readability. Formatted language-aware so it stays syntactically
   * highlightable (TypeScript uses string concatenation; cURL breaks inside the
   * quoted URL). This is what gets highlighted/rendered; `code` is copied.
   */
  display: string
  /** Number of query parameters hidden in {@link collapsed}. */
  hiddenQueryCount?: number
  /** Whether {@link collapsed} truncates a long request body. */
  truncatedBody?: boolean
  /** Stable id, e.g. `shell/curl`. */
  id: string
  /** Display label for the language tab, e.g. `cURL`. */
  label: string
  /** Shiki language id for highlighting, e.g. `bash`, `js`. */
  lang: string
  /**
   * Per-line anchor ids (0-based) for `display`. Since each query parameter is
   * placed on its own line, the whole line is made clickable — mirroring the
   * response example lines. `undefined` for non-parameter lines.
   */
  lineAnchors: (string | undefined)[]
}

/** Query parameters above this count collapse behind a "Show more" toggle. */
const collapseQueryThreshold = 2
/** Request samples with bodies above this line count collapse by default. */
const collapseBodyLineThreshold = 12

/**
 * The set of clients we expose in the code-sample selector. Kept intentionally
 * small (cURL + JavaScript fetch) to start; the `snippetz` library supports many
 * more targets if we widen this later.
 */
const clients = [
  { id: 'shell/curl', target: 'shell', client: 'curl', label: 'cURL', lang: 'bash' },
  { id: 'js/fetch', target: 'js', client: 'fetch', label: 'TypeScript', lang: 'ts' },
] as const

/**
 * Builds request code samples for an operation using `@scalar/snippetz` — the
 * same snippet generator Scalar uses. Returns one entry per supported client.
 */
export function codeSamples(
  operation: IrOperation,
  server?: string,
  options?: codeSamples.Options,
): CodeSample[] {
  const request = harRequest(operation, server)
  // Drop query parameters from the request sample when requested (the
  // collapse/"Show more" logic below then sees zero, and `splitQueryLines`
  // leaves the bare URL untouched).
  if (options?.hideQueryParams) request.queryString = []
  const generator = snippetz()
  const queryCount = request.queryString?.length ?? 0
  // When there are many query params, also prepare a request limited to the
  // first few so the sample can collapse the rest behind a "Show more" toggle.
  const collapsedRequest =
    queryCount > collapseQueryThreshold
      ? { ...request, queryString: (request.queryString ?? []).slice(0, collapseQueryThreshold) }
      : undefined

  const samples: CodeSample[] = []
  for (const client of clients) {
    const code = generator.print(client.target, client.client, request)
    if (!code) continue
    const display = splitQueryLines(code, client.lang)
    const sample: CodeSample = {
      id: client.id,
      label: client.label,
      lang: client.lang,
      code,
      display,
      anchors: pathAnchors(display, operation),
      colorRanges: queryColorRanges(display, operation),
      lineAnchors: queryLineAnchors(display, operation),
    }
    if (collapsedRequest) {
      const collapsedCode = generator.print(client.target, client.client, collapsedRequest)
      if (collapsedCode) {
        const collapsedDisplay = splitQueryLines(collapsedCode, client.lang)
        sample.collapsed = {
          display: collapsedDisplay,
          anchors: pathAnchors(collapsedDisplay, operation),
          colorRanges: queryColorRanges(collapsedDisplay, operation),
          lineAnchors: queryLineAnchors(collapsedDisplay, operation),
        }
        sample.hiddenQueryCount = queryCount - collapseQueryThreshold
      }
    }
    const collapsedDisplay = sample.collapsed?.display ?? display
    if (request.postData && collapsedDisplay.split('\n').length > collapseBodyLineThreshold) {
      const truncatedDisplay = collapsedDisplay
        .split('\n')
        .slice(0, collapseBodyLineThreshold)
        .join('\n')
      sample.collapsed = {
        display: truncatedDisplay,
        anchors: pathAnchors(truncatedDisplay, operation),
        colorRanges: queryColorRanges(truncatedDisplay, operation),
        lineAnchors: queryLineAnchors(truncatedDisplay, operation),
      }
      sample.truncatedBody = true
    }
    samples.push(sample)
  }
  return samples
}

export declare namespace codeSamples {
  type Options = {
    /** Omit query parameters from the generated request sample. */
    hideQueryParams?: boolean | undefined
  }
}

/**
 * Reformats a generated request snippet so each query parameter sits on its own
 * line. The query string lives in the first single-quoted URL containing `?`.
 *
 * - TypeScript: splits the URL literal into `'base' + '?a=1' + '&b=2'`, which is
 *   valid JS (and identical at runtime), so the copied/displayed code both work.
 * - cURL (and other shells): inserts literal newlines inside the quoted URL.
 *   This is for display only — the unformatted {@link CodeSample.code} is what
 *   the copy button uses, so the runnable request stays intact.
 */
function splitQueryLines(code: string, lang: string): string {
  const match = code.match(/'([^'\n]*\?[^'\n]*)'/)
  if (!match) return code
  const [token, url = ''] = match
  const questionIndex = url.indexOf('?')
  const base = url.slice(0, questionIndex)
  const params = url.slice(questionIndex + 1).split('&')
  if (params.length === 0) return code

  const replacement =
    lang === 'ts' || lang === 'js'
      ? [`'${base}'`, `'?${params[0]}'`, ...params.slice(1).map((p) => `'&${p}'`)].join(' +\n  ')
      : `'${base}\n  ?${params[0]}${params
          .slice(1)
          .map((p) => `\n  &${p}`)
          .join('')}'`
  return code.replace(token, replacement)
}

/**
 * Locates clickable path-parameter spans within a request sample. The
 * substituted value is matched against `display` and mapped to its docs row id
 * (`<operationId>-<slug(name)>`). Path params sit inline within the URL line, so
 * only their value is anchored (query params get whole-line anchors instead).
 *
 * Matching is deliberately conservative: a value is only anchored when it
 * appears exactly once, so an ambiguous value (e.g. a generic `0`/`string` that
 * also appears in the body) silently degrades to non-clickable.
 */
function pathAnchors(
  display: string,
  operation: IrOperation,
): { range: [number, number]; id: string }[] {
  const anchors: { range: [number, number]; id: string }[] = []
  for (const parameter of operation.parameters) {
    if (parameter.deprecated || parameter.in !== 'path') continue
    const value = encodeURIComponent(String(sampleParameter(parameter)))
    const index = singleIndexOf(display, value)
    if (index >= 0)
      anchors.push({
        range: [index, index + value.length],
        id: `${operation.id}-${slug(parameter.name)}`,
      })
  }
  return anchors
}

/**
 * Maps each line of `display` to a query parameter's docs row id, so the whole
 * line can be made clickable (like response example lines). Relies on
 * {@link splitQueryLines} having placed each query parameter on its own line
 * starting with `?`/`&` (optionally quoted in the TS variant).
 */
function queryLineAnchors(display: string, operation: IrOperation): (string | undefined)[] {
  const ids = new Map<string, string>()
  for (const parameter of operation.parameters)
    if (parameter.in === 'query' && !parameter.deprecated)
      ids.set(parameter.name, `${operation.id}-${slug(parameter.name)}`)
  return display.split('\n').map((line) => {
    const match = line.match(/^\s*'?[?&]([^=]+)=/)
    return match ? ids.get(match[1] ?? '') : undefined
  })
}

/**
 * Computes character ranges for each query parameter's name and value within
 * `display` so the UI can recolor them like the JSON response example (names use
 * the JSON-string color, values the JSON-number color). Relies on
 * {@link splitQueryLines} having placed each query parameter on its own line
 * starting with `?`/`&` (optionally quoted in the TS variant).
 */
function queryColorRanges(
  display: string,
  operation: IrOperation,
): { range: [number, number]; kind: 'key' | 'value' }[] {
  const names = new Set<string>()
  for (const parameter of operation.parameters)
    if (parameter.in === 'query' && !parameter.deprecated) names.add(parameter.name)

  const ranges: { range: [number, number]; kind: 'key' | 'value' }[] = []
  let offset = 0
  for (const line of display.split('\n')) {
    // Capture: (prefix incl. quote + ?/&)(name)(=)(value up to closing quote/EOL)
    const match = line.match(/^(\s*'?[?&])([^=]+)(=)([^'\n]*)/)
    if (match) {
      const [, prefix = '', name = '', , value = ''] = match
      if (names.has(name)) {
        // Color the `?`/`&` separator (last char of the prefix) and the name
        // together as one green span.
        const nameStart = offset + prefix.length - 1
        const nameEnd = offset + prefix.length + name.length
        ranges.push({ range: [nameStart, nameEnd], kind: 'key' })
        if (value.length > 0) {
          const valueStart = nameEnd + 1 // skip '='
          ranges.push({ range: [valueStart, valueStart + value.length], kind: 'value' })
        }
      }
    }
    offset += line.length + 1 // +1 for the consumed newline
  }
  return ranges
}

/** Returns the index of `needle` in `haystack`, or -1 unless it occurs once. */
function singleIndexOf(haystack: string, needle: string): number {
  if (!needle) return -1
  const first = haystack.indexOf(needle)
  if (first < 0) return -1
  if (haystack.indexOf(needle, first + 1) >= 0) return -1
  return first
}

/**
 * Constructs a HAR-style request from an operation by filling path/query/header
 * parameters and the request body with representative sample values. This is the
 * input `snippetz` consumes to render code samples.
 */
export function harRequest(operation: IrOperation, server?: string): Partial<HarRequest> {
  const base = (server ?? '').replace(/\/$/, '')

  let path = operation.path
  const headers: { name: string; value: string }[] = []
  const queryString: { name: string; value: string }[] = []

  for (const parameter of operation.parameters) {
    if (parameter.deprecated) continue
    const value = String(sampleParameter(parameter))
    if (parameter.in === 'path')
      path = path.replace(`{${parameter.name}}`, encodeURIComponent(value))
    else if (parameter.in === 'query') queryString.push({ name: parameter.name, value })
    else if (parameter.in === 'header' && parameter.required)
      headers.push({ name: parameter.name, value })
  }

  let postData: { mimeType: string; text: string } | undefined
  const media = operation.requestBody?.content[0]
  if (media) {
    headers.push({ name: 'Content-Type', value: media.mediaType })
    postData = { mimeType: media.mediaType, text: sampleBody(media) }
  }

  return {
    method: operation.method,
    url: `${base}${path}`,
    headers,
    queryString,
    ...(postData ? { postData } : {}),
  }
}

/**
 * A response code sample (the example body for a single status code), ready to
 * be highlighted as JSON in the right-hand panel.
 */
export type ResponseSample = {
  status: string
  description?: string | undefined
  /**
   * Id base for this response's schema rows, used to resolve per-line anchors
   * (see {@link linePaths}) to the matching documentation row's element id.
   */
  idBase: string
  lang: string
  code: string
  /**
   * `[start, end]` character ranges (into `code`) of synthesized placeholder
   * values — leaves with no authored `example`/`default`/`enum` whose value was
   * derived solely from the declared type (e.g. `"string"`, `0`). The UI dims
   * these so authored examples stand out.
   */
  placeholders: [number, number][]
  /**
   * Per-line schema path: `linePaths[i]` is the path of the property whose value
   * appears on line `i` of `code` (undefined for closing braces / blank lines).
   * The UI turns these into clickable anchors to the left-hand schema rows.
   */
  linePaths: (SchemaPath | undefined)[]
}

/** Builds JSON response samples for each response that has a usable schema/example. */
export function responseSamples(operation: IrOperation): ResponseSample[] {
  const samples: ResponseSample[] = []
  for (const response of operation.responses) {
    const media = response.content.find((entry) => entry.mediaType.includes('json'))
    if (!media) continue
    const idBase = mediaIdBase(
      responseIdBase(operation.id, response.status),
      media.mediaType,
      response.content.length,
    )
    // An authored example for the whole media type has no synthesized
    // placeholders; build a tree from the literal value so we can still emit
    // per-line anchors. Otherwise build a tagged tree from the schema so we can
    // also dim type-derived leaves.
    const tree =
      media.example !== undefined ? sampleTreeFromValue(media.example) : sampleTree(media.schema)
    if (tree === undefined) continue
    const { code, placeholders, linePaths } = serializeSample(tree)
    samples.push({
      status: response.status,
      description: response.description,
      idBase,
      lang: 'json',
      code,
      placeholders,
      linePaths,
    })
  }
  return samples
}

/** Serializes a request body media type to its example/sample JSON text. */
function sampleBody(media: IrMediaType): string {
  const value = media.example ?? sampleFromSchema(media.schema)
  if (media.mediaType.includes('json')) return JSON.stringify(value ?? {}, null, 2)
  return typeof value === 'string' ? value : JSON.stringify(value ?? {})
}

/** Produces a representative value for a single parameter. */
function sampleParameter(parameter: IrParameter): unknown {
  const value = sampleFromSchema(parameter.schema)
  if (value !== undefined) return value
  return parameter.name
}

/**
 * A tagged sample value tree. Leaves carry a `placeholder` flag indicating the
 * value was synthesized from the declared type (no authored `example`/`default`/
 * `enum`), so the UI can dim it.
 */
type SampleNode =
  | { kind: 'object'; entries: [string, SampleNode][]; pathSegment?: string }
  | { kind: 'array'; items: SampleNode[]; pathSegment?: string }
  | { kind: 'leaf'; value: unknown; placeholder: boolean }

/**
 * Builds a tagged sample tree from a (dereferenced) JSON Schema, preferring
 * authored `example`/`default`/`enum` values and otherwise synthesizing one
 * from the declared type. Bounded by a recursion depth to guard against cycles.
 */
function sampleTree(
  schema: Record<string, unknown> | undefined,
  depth = 0,
): SampleNode | undefined {
  if (!schema || depth > 6) return undefined

  if (schema['example'] !== undefined)
    return { kind: 'leaf', value: schema['example'], placeholder: false }
  const examples = schema['examples']
  if (Array.isArray(examples) && examples.length > 0)
    return { kind: 'leaf', value: examples[0], placeholder: false }
  if (schema['default'] !== undefined)
    return { kind: 'leaf', value: schema['default'], placeholder: false }
  const enumValues = schema['enum']
  if (Array.isArray(enumValues) && enumValues.length > 0)
    return { kind: 'leaf', value: enumValues[0], placeholder: false }

  // oneOf/anyOf variant picker (matching the docs renderer): sample the first
  // variant and tag the resulting node with the variant's path segment, so its
  // children's anchor paths line up with the variant-qualified docs rows.
  if (schema['type'] !== 'array') {
    const variants = unionVariantSchemas(schema)
    if (variants) {
      const node = sampleTree(variants[0] as Record<string, unknown>, depth + 1)
      if (node && (node.kind === 'object' || node.kind === 'array'))
        return { ...node, pathSegment: unionVariantSegment(0) }
      return node
    }
  }

  // Composition keywords: fall back to the first usable subschema.
  for (const key of ['allOf', 'anyOf', 'oneOf'] as const) {
    const subschemas = schema[key]
    if (Array.isArray(subschemas) && subschemas[0])
      return sampleTree(subschemas[0] as Record<string, unknown>, depth + 1)
  }

  const rawType = schema['type']
  const type = Array.isArray(rawType) ? rawType[0] : rawType

  if (type === 'object' || schema['properties']) {
    const properties = (schema['properties'] ?? {}) as Record<string, Record<string, unknown>>
    const entries: [string, SampleNode][] = []
    for (const [name, property] of Object.entries(properties)) {
      const node = sampleTree(property, depth + 1)
      // Match `JSON.stringify`, which drops keys whose value is `undefined`.
      if (node !== undefined) entries.push([name, node])
    }
    return { kind: 'object', entries }
  }

  if (type === 'array') {
    const items = schema['items'] as Record<string, unknown> | undefined
    const item = sampleTree(items, depth + 1)
    return { kind: 'array', items: item === undefined ? [] : [item] }
  }

  if (type === 'string') {
    const format = schema['format']
    if (format === 'date-time')
      return { kind: 'leaf', value: new Date(0).toISOString(), placeholder: true }
    if (format === 'date')
      return { kind: 'leaf', value: new Date(0).toISOString().slice(0, 10), placeholder: true }
    if (format === 'uuid')
      return { kind: 'leaf', value: '00000000-0000-0000-0000-000000000000', placeholder: true }
    return { kind: 'leaf', value: 'string', placeholder: true }
  }
  if (type === 'integer' || type === 'number') return { kind: 'leaf', value: 0, placeholder: true }
  if (type === 'boolean') return { kind: 'leaf', value: true, placeholder: true }

  return undefined
}

/**
 * Builds a {@link SampleNode} tree from an already-resolved literal value (an
 * authored media-type example). All leaves are non-placeholders since the value
 * was authored. Object keys whose value serializes to `undefined` are dropped to
 * match `JSON.stringify`.
 */
function sampleTreeFromValue(value: unknown): SampleNode {
  if (Array.isArray(value))
    return { kind: 'array', items: value.map((item) => sampleTreeFromValue(item ?? null)) }
  if (value && typeof value === 'object') {
    const entries: [string, SampleNode][] = []
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (JSON.stringify(child) === undefined) continue
      entries.push([key, sampleTreeFromValue(child)])
    }
    return { kind: 'object', entries }
  }
  return { kind: 'leaf', value, placeholder: false }
}

/** Strips the placeholder tags from a {@link SampleNode} into a plain value. */
function toValue(node: SampleNode | undefined): unknown {
  if (node === undefined) return undefined
  if (node.kind === 'leaf') return node.value
  if (node.kind === 'array') return node.items.map(toValue)
  const result: Record<string, unknown> = {}
  for (const [name, child] of node.entries) result[name] = toValue(child)
  return result
}

/**
 * Pretty-prints a {@link SampleNode} as JSON (matching
 * `JSON.stringify(value, null, 2)`) while recording `[start, end]` character
 * ranges of placeholder leaf literals.
 */
function serializeSample(root: SampleNode): {
  code: string
  placeholders: [number, number][]
  linePaths: (SchemaPath | undefined)[]
} {
  let code = ''
  let line = 0
  const placeholders: [number, number][] = []
  const linePaths: (SchemaPath | undefined)[] = []

  function mark(path: SchemaPath) {
    if (path.length > 0) linePaths[line] = path
  }

  function newline() {
    code += '\n'
    line++
  }

  function walk(node: SampleNode, indent: number, path: SchemaPath) {
    const pad = '  '.repeat(indent)
    const padInner = '  '.repeat(indent + 1)
    // Union variant nodes carry a virtual path segment (e.g. `variant-0`) so
    // their children's anchor paths match the variant-qualified docs rows.
    const childBase = node.kind !== 'leaf' && node.pathSegment ? [...path, node.pathSegment] : path
    if (node.kind === 'object') {
      if (node.entries.length === 0) {
        code += '{}'
        return
      }
      code += '{'
      newline()
      node.entries.forEach(([key, value], index) => {
        const childPath = [...childBase, key]
        mark(childPath)
        code += `${padInner}${JSON.stringify(key)}: `
        walk(value, indent + 1, childPath)
        code += index < node.entries.length - 1 ? ',' : ''
        newline()
      })
      code += `${pad}}`
      return
    }
    if (node.kind === 'array') {
      if (node.items.length === 0) {
        code += '[]'
        return
      }
      code += '['
      newline()
      node.items.forEach((item, index) => {
        // Scalar array items map to the array property's own path.
        if (item.kind === 'leaf') mark(childBase)
        code += padInner
        walk(item, indent + 1, childBase)
        code += index < node.items.length - 1 ? ',' : ''
        newline()
      })
      code += `${pad}]`
      return
    }
    const literal = JSON.stringify(node.value) ?? 'null'
    const start = code.length
    code += literal
    if (node.placeholder) placeholders.push([start, code.length])
  }

  walk(root, 0, [])
  return { code, placeholders, linePaths }
}

/**
 * Generates a representative value from a (dereferenced) JSON Schema, preferring
 * authored `example`/`default`/`enum` values and otherwise synthesizing one from
 * the declared type. Bounded by a recursion depth to guard against cycles.
 */
function sampleFromSchema(schema: Record<string, unknown> | undefined, depth = 0): unknown {
  return toValue(sampleTree(schema, depth))
}
