export const getDefaultAdapter = () =>
  // biome-ignore lint/complexity/useLiteralKeys: _
  process.env['VERCEL']
    ? 'waku/adapters/vercel'
    : // biome-ignore lint/complexity/useLiteralKeys: _
      process.env['NETLIFY']
      ? 'waku/adapters/netlify'
      : 'waku/adapters/node'
