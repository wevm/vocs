import { describe, expect, it } from 'vitest'
import { patchRouterPrefetchCode } from './vite-plugins.js'

describe('patchRouterPrefetchCode', () => {
  it('maps route module ids through the global module id list', () => {
    const code = `
const getRouterPrefetchCode = (path2moduleIds)=>{
    const moduleIdSet = new Set();
    Object.values(path2moduleIds).forEach((ids)=>ids.forEach((id)=>moduleIdSet.add(id)));
    const ids = Array.from(moduleIdSet);
    const path2idxs = {};
    Object.entries(path2moduleIds).forEach(([path, ids])=>{
        path2idxs[path] = ids.map((id)=>ids.indexOf(id));
    });
    return \`
globalThis.__WAKU_ROUTER_PREFETCH__ = (path, callback) => {
  const ids = \${JSON.stringify(ids)};
  const path2idxs = \${JSON.stringify(path2idxs)};
  const key = Object.keys(path2idxs).find((key) => new RegExp(key).test(path));
  for (const idx of path2idxs[key] || []) {
    callback(ids[idx]);
  }
};
\`;
};`

    const patched = patchRouterPrefetchCode(
      code,
      '/repo/node_modules/waku/dist/router/define-router.js',
    )

    expect(patched).toContain('pathIds.map((id)=>ids.indexOf(id))')
  })

  it('ignores other modules', () => {
    expect(patchRouterPrefetchCode('', '/repo/node_modules/waku/dist/router/client.js')).toBe(
      undefined,
    )
  })
})
