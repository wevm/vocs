export const getDefaultAdapter = () =>
  process.env['VERCEL']
    ? 'vocs/waku/internal/patches/adapters/vercel'
    : process.env['NETLIFY']
      ? 'waku/adapters/netlify'
      : 'vocs/waku/internal/patches/adapters/node'
