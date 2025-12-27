import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
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

/**
 * Builds a script to preview the build output.
 */
export function preview(): Plugin {
  let outDir: string

  return {
    name: 'vocs:preview',
    apply: 'build',
    configResolved(resolvedConfig) {
      outDir = path.resolve(resolvedConfig.root, resolvedConfig.build.outDir)
    },
    async closeBundle() {
      const previewScript = `\
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { join } from 'node:path';

const serveNodePath = join(import.meta.dirname, 'serve-node.js');

if (!existsSync(serveNodePath)) {
  console.error('Error: serve-node.js not found.');
  console.error('The preview script is only compatible with the Node.js adapter for now.');
  process.exit(1);
}

function findFreePort(startPort = 3000) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(startPort, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') resolve(findFreePort(startPort + 1));
      else reject(err);
    });
  });
}

process.env.PORT ??= String(await findFreePort());

console.log(\`Starting preview server at http://localhost:\${process.env.PORT}\`);

await import('./serve-node.js');
`

      const previewPath = path.join(outDir, 'preview.js')
      if (!existsSync(outDir)) await fs.mkdir(outDir, { recursive: true })
      await fs.writeFile(previewPath, previewScript, { encoding: 'utf-8' })
    },
  }
}

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

if (import.meta.hot)
  import.meta.hot.on('vocs:config', (data) => {
    globalThis.dispatchEvent(new CustomEvent('vocs:config', { detail: data }));
  });
`
      }
      return
    },
  }
}
