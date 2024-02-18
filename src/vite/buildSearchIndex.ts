import { resolveOutDir } from './utils/resolveOutDir.js'
import { resolveVocsConfig } from './utils/resolveVocsConfig.js'
import { buildIndex, saveIndex } from './utils/search.js'

export type BuildSearchIndexParameters = {
  outDir?: string
}

export async function buildSearchIndex({ outDir }: BuildSearchIndexParameters) {
  const { config } = await resolveVocsConfig()
  const { rootDir } = config
  const outDir_resolved = resolveOutDir(rootDir, outDir)

  const index = await buildIndex({ baseDir: rootDir })
  saveIndex(outDir_resolved, index)
}
