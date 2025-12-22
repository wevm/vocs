import type { Plugin } from 'vite'
import type { Config as WakuConfig } from 'waku/config'
import {
  EXTENSIONS,
  SRC_CLIENT_ENTRY,
  SRC_MIDDLEWARE,
  SRC_PAGES,
  SRC_SERVER_ENTRY,
} from './patches/constants.js'

export {
  unstable_allowServerPlugin as allowServer,
  unstable_buildMetadataPlugin as buildMetadata,
  unstable_defaultAdapterPlugin as defaultAdapter,
  unstable_fallbackHtmlPlugin as fallbackHtml,
  unstable_mainPlugin as main,
  unstable_notFoundPlugin as notFound,
  unstable_patchRsdwPlugin as patchRsdw,
  unstable_privateDirPlugin as privateDir,
  unstable_virtualConfigPlugin as virtualConfig,
} from 'waku/vite-plugins'
export { fsRouterTypegenPlugin as fsRouterTypegen } from './patches/vite-plugins/fs-router-typegen.js'

export function userEntries(config: Required<WakuConfig>): Plugin {
  return {
    name: 'waku:vite-plugins:user-entries',
    // resolve user entries and fallbacks to "managed mode" if not found.
    async resolveId(source, _importer, options) {
      if (source === 'virtual:vite-rsc-waku/server-entry') return '\0' + source
      if (source === 'virtual:vite-rsc-waku/server-entry-inner') {
        const resolved = await this.resolve(
          `/${config.srcDir}/${SRC_SERVER_ENTRY}`,
          undefined,
          options,
        )
        return resolved ? resolved : '\0' + source
      }
      if (source === 'virtual:vite-rsc-waku/client-entry') {
        const resolved = await this.resolve(
          `/${config.srcDir}/${SRC_CLIENT_ENTRY}`,
          undefined,
          options,
        )
        return resolved ? resolved : '\0' + source
      }
      return
    },
    load(id) {
      if (id === '\0virtual:vite-rsc-waku/server-entry') {
        return `\
export { default } from 'virtual:vite-rsc-waku/server-entry-inner';
if (import.meta.hot) {
  import.meta.hot.accept()
}
`
      }
      if (id === '\0virtual:vite-rsc-waku/server-entry-inner') {
        const globBase = `/${config.srcDir}/${SRC_PAGES}`
        const globPattern = `${globBase}/**/*.{${EXTENSIONS.map((ext) => ext.slice(1)).join(',')}}`
        const middlewareGlob = `/${config.srcDir}/${SRC_MIDDLEWARE}/*.{${EXTENSIONS.map((ext) => ext.slice(1)).join(',')}}`
        return `
import { router } from 'vocs/waku/router';
import adapter from 'waku/adapters/default';

export default adapter(
  router(
    import.meta.glob(
      ${JSON.stringify(globPattern)},
      { base: ${JSON.stringify(globBase)} }
    )
  ),
  {
    middlewareModules: import.meta.glob(${JSON.stringify(middlewareGlob)}),
  },
);
`
      }
      if (id === '\0virtual:vite-rsc-waku/client-entry') {
        return `
import { StrictMode, createElement } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { Router } from 'waku/router/client';

const rootElement = createElement(StrictMode, null, createElement(Router));

if (globalThis.__WAKU_HYDRATE__) {
  hydrateRoot(document, rootElement);
} else {
  createRoot(document).render(rootElement);
}
`
      }
      return
    },
  }
}
