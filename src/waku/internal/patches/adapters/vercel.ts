import vercel from 'waku/adapters/vercel'

const vocsVercelBuildEnhancer = 'vocs/waku/internal/patches/adapters/vercel-build-enhancer'

const adapter: typeof vercel = (handlers, options) => {
  const serverEntry = vercel(handlers, options)
  const buildEnhancers = (serverEntry.buildEnhancers ?? []).map((enhancer) =>
    enhancer === 'waku/adapters/vercel-build-enhancer' ? vocsVercelBuildEnhancer : enhancer,
  )

  return {
    ...serverEntry,
    buildEnhancers: buildEnhancers.length ? buildEnhancers : [vocsVercelBuildEnhancer],
  }
}

export default adapter
