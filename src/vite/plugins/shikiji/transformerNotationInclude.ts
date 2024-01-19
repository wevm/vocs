import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { ShikijiTransformer } from 'shikiji'

const includeRegex = /\/\/ \[!include (.*)\]/
const regionRegex = /\/\/ \[!region (.*)\]/
const endRegionRegex = /\/\/ \[!endregion (.*)\]/

export type TransformerNotationIncludeOptions = {
  rootDir: string
}

export const transformerNotationInclude = ({
  rootDir,
}: TransformerNotationIncludeOptions): ShikijiTransformer => ({
  name: 'includes',
  preprocess(code) {
    if (!code) return code

    const includes = code.includes('// [!include')
    if (!includes) return code

    const lines = code.split('\n')
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      const match = line.match(includeRegex)
      if (match) {
        const [, value] = match
        const [fileName, region] = value.split(' ')
        const path = resolve(rootDir, fileName.replace('~', '.'))
        const contents = readFileSync(path, { encoding: 'utf-8' }).replace(/\n$/, '')
        lines.splice(i, 1, extractRegion(contents, region))
      }
      i++
    }
    return lines.join('\n')
  },
})

function extractRegion(code: string, region: string | undefined) {
  const lines = []

  let inRegion = !region
  for (const line of code.split('\n')) {
    const startRegionMatch = line.match(regionRegex)
    const endRegionMatch = line.match(endRegionRegex)

    // If we are in a region, ignore any other region markers.
    if (inRegion && !startRegionMatch && !endRegionMatch) lines.push(line.replaceAll(/_\$\d*/g, ''))
    // If we have have found a `// [!region ${region}]` marker, start including lines.
    else if (startRegionMatch) {
      const [, regionName] = startRegionMatch
      if (regionName === region) {
        inRegion = true
      }
    }
    // If we have have found a `// [!endregion ${region}]` marker, stop including lines.
    else if (endRegionMatch) {
      const [, regionName] = endRegionMatch
      if (regionName === region) {
        inRegion = false
      }
    }
  }

  return lines.join('\n')
}
