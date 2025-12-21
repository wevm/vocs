import reactPlugin from '@vitejs/plugin-react'
import rscPlugin from '@vitejs/plugin-rsc'
import type { Plugin, PluginOption } from 'vite'
import type { Config } from 'waku/config'
import {
  unstable_allowServerPlugin,
  unstable_buildMetadataPlugin,
  unstable_defaultAdapterPlugin,
  unstable_fallbackHtmlPlugin,
  unstable_mainPlugin,
  unstable_notFoundPlugin,
  unstable_patchRsdwPlugin,
  unstable_privateDirPlugin,
  unstable_virtualConfigPlugin,
} from 'waku/vite-plugins'

import * as plugin from '../vite.js'
import {
  EXTENSIONS,
  SRC_CLIENT_ENTRY,
  SRC_MIDDLEWARE,
  SRC_PAGES,
  SRC_SERVER_ENTRY,
} from './patches/constants.js'
import { getDefaultAdapter } from './patches/utils/default-adapter.js'
import { fsRouterTypegenPlugin } from './patches/vite-plugins/fs-router-typegen.js'

/**
 * Creates a Vite plugin for Vocs, with given configuration.
 *
 * @param options - Configuration options.
 * @returns Plugin
 */
export function vocs(options: vocs.Options = {}): PluginOption {
  const { waku = {}, ...rest } = options

  const config: Required<Config> = {
    basePath: '/',
    srcDir: 'src',
    distDir: 'dist',
    privateDir: 'private',
    rscBase: 'RSC',
    unstable_adapter: getDefaultAdapter(),
    vite: {},
    ...waku,
  }

  return [
    plugin.vocs(rest),
    reactPlugin(),
    unstable_allowServerPlugin(),
    rscPlugin({
      serverHandler: false,
      keepUseCientProxy: true,
      useBuildAppHook: true,
      clientChunks: (meta) => meta.serverChunk,
    }),
    unstable_mainPlugin(config),
    userEntriesPlugin(config),
    unstable_virtualConfigPlugin(config),
    unstable_defaultAdapterPlugin(config),
    unstable_notFoundPlugin(),
    unstable_patchRsdwPlugin(),
    unstable_buildMetadataPlugin(config),
    unstable_privateDirPlugin(config),
    unstable_fallbackHtmlPlugin(),
    fsRouterTypegenPlugin(config),
  ]
}

export declare namespace vocs {
  type Options = plugin.vocs.Options & {
    waku?: Config | undefined
  }
}

function userEntriesPlugin(config: Required<Config>): Plugin {
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
