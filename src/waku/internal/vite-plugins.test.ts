import { describe, expect, it } from 'vitest'
import {
  patchBrowserRscUpdateCode,
  patchClientRscPrefetchCode,
  patchRouterHmrRefetchCode,
  patchRouterPrefetchCode,
} from './vite-plugins.js'

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

describe('patchClientRscPrefetchCode', () => {
  it('decodes and reuses prefetched RSC elements', () => {
    const code = `
const KEY_RESPONSE = 'r';
const KEY_CLOSE = 'x';
const fetchRscInternal = (fetchRscStore, rscPath, rscParams, prefetchOnly)=>{
    const responsePromise = prefetchedEntry ? prefetchedEntry[KEY_RESPONSE] : fetchFn(url);
    if (prefetchOnly) {
        prefetched[rscPath] = {
            [KEY_RESPONSE]: responsePromise,
            [KEY_CLIENT_PREFETCHED]: true,
            [KEY_RSC_PARAMS]: rscParams,
            [KEY_TEMPORARY_REFERENCES]: temporaryReferences
        };
        return undefined;
    }
    const elements = createFromFetch(checkStatus(responsePromise), {
        callServer: (funcId, args)=>unstable_callServerRsc(funcId, args, ()=>fetchRscStore),
        debugChannel: debug?.debugChannel,
        temporaryReferences
    });
};`

    const patched = patchClientRscPrefetchCode(
      code,
      '/repo/node_modules/waku/dist/minimal/client.js',
    )

    expect(patched).toContain("const KEY_ELEMENTS = 'e';")
    expect(patched).toContain('const createElements = ()=>createFromFetch')
    expect(patched).toContain('Promise.resolve(elements).catch(()=>{});')
    expect(patched).toContain('[KEY_ELEMENTS]: elements')
    expect(patched).toContain(
      'const elements = prefetchedEntry?.[KEY_ELEMENTS] || createElements();',
    )
  })

  it('ignores other modules', () => {
    expect(patchClientRscPrefetchCode('', '/repo/node_modules/waku/dist/router/client.js')).toBe(
      undefined,
    )
  })
})

describe('patchRouterHmrRefetchCode', () => {
  it('bypasses prefetched and browser-cached RSC data during route HMR', () => {
    const code = `
const InnerRouter = ()=>{
    if (import.meta.hot) {
        const refetchRoute = ()=>{
            staticPathSetRef.current.clear();
            cachedIdSetRef.current.clear();
            const rscPath = encodeRoutePath(route.path);
            const rscParams = createRscParams(route.query);
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            refetch(rscPath, rscParams);
        };
    }
}`

    const patched = patchRouterHmrRefetchCode(code, '/repo/node_modules/waku/dist/router/client.js')

    expect(patched).toContain("init.cache = 'no-store';")
    expect(patched).toContain('delete globalThis.__WAKU_PREFETCHED__?.[rscPath];')
    expect(patched).toContain('withEnhanceFetchFn(hmrRefetchEnhancer)')
  })

  it('ignores other modules', () => {
    expect(
      patchRouterHmrRefetchCode('', '/repo/node_modules/waku/dist/router/define-router.js'),
    ).toBe(undefined)
  })
})

describe('patchBrowserRscUpdateCode', () => {
  it('prefers the router refetcher for RSC updates', () => {
    const code = `
if (import.meta.hot) {
    import.meta.hot.on('rsc:update', (e)=>{
        console.log('[rsc:update]', e);
        globalThis.__WAKU_RSC_RELOAD_LISTENERS__?.forEach((l)=>l());
    });
}`

    const patched = patchBrowserRscUpdateCode(
      code,
      '/repo/node_modules/waku/dist/lib/vite-entries/entry.browser.js',
    )

    expect(patched).toContain('import.meta.hot.accept();')
    expect(patched).toContain('if (globalThis.__WAKU_REFETCH_ROUTE__)')
    expect(patched).toContain('globalThis.__WAKU_REFETCH_ROUTE__();')
    expect(patched).toContain('globalThis.__WAKU_RSC_RELOAD_LISTENERS__?.forEach((l)=>l());')
  })

  it('ignores other modules', () => {
    expect(patchBrowserRscUpdateCode('', '/repo/node_modules/waku/dist/router/client.js')).toBe(
      undefined,
    )
  })
})
