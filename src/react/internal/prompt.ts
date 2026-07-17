export type Token = {
  type: 'code' | 'label' | 'marker' | 'placeholder' | 'text' | 'url'
  value: string
}

const labelRegex = /^(\s*)([A-Z][A-Za-z0-9 /_-]{0,31}:)(?=\s|$)/
const listMarkerRegex = /^(\s*)([-*+]|\d+[.)])(?=\s)/
const trailingUrlPunctuationRegex = /[\]})>,.;:!?]+$/

export function tokenize(value: string): tokenize.ReturnType {
  const tokens: Token[] = []
  const lines = value.split('\n')

  for (const [index, line] of lines.entries()) {
    tokenizeLine(line, tokens)
    if (index < lines.length - 1) push(tokens, 'text', '\n')
  }

  return tokens
}

export declare namespace tokenize {
  type ReturnType = Token[]
}

function tokenizeLine(line: string, tokens: Token[]) {
  const listMarker = line.match(listMarkerRegex)
  if (listMarker) {
    push(tokens, 'text', listMarker[1] ?? '')
    push(tokens, 'marker', listMarker[2] ?? '')
    tokenizeInline(line.slice(listMarker[0].length), tokens)
    return
  }

  const label = line.match(labelRegex)
  if (label) {
    push(tokens, 'text', label[1] ?? '')
    push(tokens, 'label', label[2] ?? '')
    tokenizeInline(line.slice(label[0].length), tokens)
    return
  }

  tokenizeInline(line, tokens)
}

function tokenizeInline(value: string, tokens: Token[]) {
  const tokenRegex =
    /`[^`\n]+`|https?:\/\/[^\s`]+|\{\{[^{}\n]+\}\}|\$\{[^{}\n]+\}|<[A-Z][A-Z0-9_-]*>|\$[A-Z][A-Z0-9_]*/g
  let cursor = 0

  for (const match of value.matchAll(tokenRegex)) {
    const index = match.index
    const raw = match[0]
    push(tokens, 'text', value.slice(cursor, index))

    if (raw.startsWith('`')) push(tokens, 'code', raw)
    else if (raw.startsWith('http')) pushUrl(tokens, raw)
    else push(tokens, 'placeholder', raw)

    cursor = index + raw.length
  }

  push(tokens, 'text', value.slice(cursor))
}

function pushUrl(tokens: Token[], value: string) {
  const trailing = value.match(trailingUrlPunctuationRegex)?.[0] ?? ''
  const url = trailing ? value.slice(0, -trailing.length) : value
  push(tokens, 'url', url)
  push(tokens, 'text', trailing)
}

function push(tokens: Token[], type: Token['type'], value: string) {
  if (!value) return
  const previous = tokens.at(-1)
  if (type === 'text' && previous?.type === 'text') previous.value += value
  else tokens.push({ type, value })
}
