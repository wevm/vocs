import type { PluginOption } from 'vite'

// copy from constants.ts
const CSS_LANGS_RE =
  // eslint-disable-next-line regexp/no-unused-capturing-group
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/
export const isCSSRequest = (request: string): boolean => CSS_LANGS_RE.test(request)

type AdvancedChunksGroup = {
  name: string
  test: RegExp
  priority?: number
  minSize?: number
  maxSize?: number
}

type AdvancedChunksOptions = {
  minSize?: number
  maxSize?: number
  groups?: AdvancedChunksGroup[]
}

type OutputOptions = {
  format?: string
  manualChunks?: unknown
  advancedChunks?: AdvancedChunksOptions
  [key: string]: unknown
}

type OutputWithAdvancedChunks = OutputOptions & {
  advancedChunks?: AdvancedChunksOptions
}

const VENDOR_GROUP: AdvancedChunksGroup = {
  name: 'vendor',
  // keep CSS out of the vendor chunk to mirror Vite's default behaviour
  test: /node_modules\/(?!.*\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?))/,
  priority: 1,
}

function mergeAdvancedChunks(
  existing: AdvancedChunksOptions | undefined,
  group: AdvancedChunksGroup,
): AdvancedChunksOptions {
  const groups = existing?.groups ? [...existing.groups] : []
  const hasGroup = groups.some((g) => g.name === group.name)
  if (!hasGroup) groups.push(group)

  return {
    ...existing,
    groups,
  }
}

function normalizeOutputs(output: any): OutputWithAdvancedChunks[] {
  if (!output) return []
  return Array.isArray(output)
    ? (output as OutputWithAdvancedChunks[])
    : [output as OutputWithAdvancedChunks]
}

function addVendorGroupToOutputs(
  output: any,
): OutputWithAdvancedChunks | OutputWithAdvancedChunks[] | undefined {
  if (!output) return { advancedChunks: { groups: [VENDOR_GROUP] } }
  if (Array.isArray(output))
    return output.map((o) => ({
      ...o,
      advancedChunks: mergeAdvancedChunks(o.advancedChunks, VENDOR_GROUP),
    }))
  return { ...output, advancedChunks: mergeAdvancedChunks(output.advancedChunks, VENDOR_GROUP) }
}

export function splitVendorChunkPlugin(): PluginOption {
  return {
    name: 'vite:split-vendor-chunk',
    config(config) {
      const rolldownOutput = config?.build?.rolldownOptions?.output
      const legacyRollupOutput = config?.build?.rollupOptions?.output
      const userOutput = rolldownOutput ?? legacyRollupOutput

      const outputs = normalizeOutputs(userOutput)
      for (const output of outputs)
        output.advancedChunks = mergeAdvancedChunks(output.advancedChunks, VENDOR_GROUP)

      const baseRolldownOptions =
        config?.build?.rolldownOptions ?? config?.build?.rollupOptions ?? {}

      return {
        build: {
          // rolldownOptions is the preferred key; rollupOptions remains for user compatibility
          rolldownOptions: {
            ...baseRolldownOptions,
            output: addVendorGroupToOutputs(userOutput) as any,
          },
        },
      }
    },
  }
}
