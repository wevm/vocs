import { randomBytes } from 'node:crypto'
import { existsSync } from 'node:fs'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type { Plugin } from 'vite'
import type { Config as WakuConfig } from 'waku/config'
import * as VocsConfig from '../../internal/config.js'
import {
  EXTENSIONS,
  SRC_CLIENT_ENTRY,
  SRC_MIDDLEWARE,
  SRC_PAGES,
  SRC_SERVER_ENTRY,
} from './patches/constants.js'

export {
  unstable_adapterAliasPlugin as adapterAlias,
  unstable_allowServerPlugin as allowServer,
  unstable_buildMetadataPlugin as buildMetadata,
  unstable_environmentsPlugin as environments,
  unstable_htmlShellPlugin as htmlShell,
  unstable_notFoundPlugin as notFound,
  unstable_patchRsdwPlugin as patchRsdw,
  unstable_privateDirPlugin as privateDir,
  unstable_staticBuildPlugin as staticBuild,
  unstable_virtualConfigPlugin as virtualConfig,
} from 'waku/vite-plugins'
export { fsRouterTypegenPlugin as fsRouterTypegen } from './patches/vite-plugins/fs-router-typegen.js'

export function buildId(): Plugin {
  const key = 'import.meta.env.WAKU_BUILD_ID'
  const buildId = randomBytes(6).toString('base64url')

  return {
    name: 'vocs:build-id',
    config(merged, env) {
      if (merged.define && key in merged.define) return
      return {
        define: {
          [key]: JSON.stringify(env.command === 'serve' ? 'dev' : buildId),
        },
      }
    },
  }
}

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

const wakuDefineRouterRegex = /[/\\]waku[/\\]dist[/\\]router[/\\]define-router\.js(?:\?.*)?$/
const wakuMinimalClientRegex = /[/\\]waku[/\\]dist[/\\]minimal[/\\]client\.js(?:\?.*)?$/

// TODO: Remove these Waku prefetch patches once https://github.com/wakujs/waku/issues/2099 is fixed.
const wakuRouterPrefetchCodeRegex =
  /Object\.entries\(path2moduleIds\)\.forEach\(\(\[path,\s*ids\]\)=>\{\s*path2idxs\[path\]\s*=\s*ids\.map\(\(id\)=>ids\.indexOf\(id\)\);\s*\}\);/

const wakuClientPrefetchKeysCode = `const KEY_RESPONSE = 'r';
const KEY_CLOSE = 'x';`
const wakuClientPrefetchKeysPatchedCode = `const KEY_RESPONSE = 'r';
const KEY_ELEMENTS = 'e';
const KEY_CLOSE = 'x';`

const wakuClientPrefetchElementsCode = `    if (prefetchOnly) {
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
    });`
const wakuClientPrefetchElementsPatchedCode = `    const createElements = ()=>createFromFetch(checkStatus(responsePromise), {
        callServer: (funcId, args)=>unstable_callServerRsc(funcId, args, ()=>fetchRscStore),
        debugChannel: debug?.debugChannel,
        temporaryReferences
    });
    if (prefetchOnly) {
        const elements = createElements();
        Promise.resolve(elements).catch(()=>{});
        prefetched[rscPath] = {
            [KEY_RESPONSE]: responsePromise,
            [KEY_ELEMENTS]: elements,
            [KEY_CLIENT_PREFETCHED]: true,
            [KEY_RSC_PARAMS]: rscParams,
            [KEY_TEMPORARY_REFERENCES]: temporaryReferences
        };
        return undefined;
    }
    const elements = prefetchedEntry?.[KEY_ELEMENTS] || createElements();`

export function patchRouterPrefetchCode(code: string, id: string) {
  if (!wakuDefineRouterRegex.test(id)) return
  const patched = code.replace(
    wakuRouterPrefetchCodeRegex,
    `Object.entries(path2moduleIds).forEach(([path, pathIds])=>{
        path2idxs[path] = pathIds.map((id)=>ids.indexOf(id));
    });`,
  )
  if (patched === code) return
  return patched
}

export function patchClientRscPrefetchCode(code: string, id: string) {
  if (!wakuMinimalClientRegex.test(id)) return
  if (!code.includes(wakuClientPrefetchKeysCode) || !code.includes(wakuClientPrefetchElementsCode))
    return
  const patched = code
    .replace(wakuClientPrefetchKeysCode, wakuClientPrefetchKeysPatchedCode)
    .replace(wakuClientPrefetchElementsCode, wakuClientPrefetchElementsPatchedCode)
  return patched
}

export function patchWakuPrefetchCode(code: string, id: string) {
  return patchRouterPrefetchCode(code, id) ?? patchClientRscPrefetchCode(code, id)
}

export function patchRouterPrefetch(): Plugin {
  return {
    name: 'vocs:patch-router-prefetch',
    enforce: 'pre',
    transform(code, id) {
      const patched = patchWakuPrefetchCode(code, id)
      if (!patched) return null
      return { code: patched, map: null }
    },
  }
}

export function userEntries(config: Required<WakuConfig>, vocsConfig: VocsConfig.Config): Plugin {
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
import { middlewareModules } from 'vocs/waku/middleware';
import { router } from 'vocs/waku/router';
import adapter from 'waku/adapters/default';

export default adapter(
  router(
    import.meta.glob(
      ${JSON.stringify(globPattern)}
    ),
    { srcDir: ${JSON.stringify(config.srcDir)} }
  ),
  {
    middlewareModules: middlewareModules(
      import.meta.glob(${JSON.stringify(middlewareGlob)})
    ),
    static: ${vocsConfig.renderStrategy === 'full-static'},
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

/**
 * Bundles vocs.config.ts into the server build output.
 * Only runs during RSC environment build.
 */
export function vocsConfig(config: VocsConfig.Config): Plugin {
  const configFile = VocsConfig.getConfigFile({ rootDir: config.rootDir })
  const configPath = configFile ? path.resolve(config.rootDir, configFile) : undefined
  const configDir = configPath ? path.dirname(configPath) : undefined

  // Track files directly imported by the config to bundle together
  const imports = new Set<string>()

  let isBuild = false

  return {
    name: 'vocs:config-bundle',
    config() {
      return {
        environments: {
          rsc: {
            build: {
              rolldownOptions: {
                external: ['fsevents', 'vite'],
                output: {
                  manualChunks(id) {
                    // Only bundle files explicitly imported by vocs.config
                    if (imports.has(id)) return 'vocs.config'
                    return undefined
                  },
                },
              },
            },
            resolve: {
              noExternal: ['@takumi-rs/wasm', '@takumi-rs/image-response'],
            },
          },
        },
      }
    },
    // Track which local files the config imports (e.g. sidebar.ts)
    resolveId(source, importer) {
      if (!configPath || !configDir || !importer) return null
      // If the importer is the config file and source is a relative import
      if (importer === configPath && source.startsWith('./')) {
        const resolved = path.resolve(configDir, source)
        // Find the actual file with extension
        for (const ext of ['.ts', '.tsx', '.js', '.jsx', '.mjs']) {
          const fullPath = resolved.endsWith(ext) ? resolved : resolved + ext
          if (existsSync(fullPath)) {
            imports.add(fullPath)
            break
          }
        }
      }
      return null
    },
    configResolved(resolvedConfig) {
      isBuild = resolvedConfig.command === 'build'
    },
    buildStart() {
      if (!isBuild || !configPath) return
      const envName = (this as unknown as { environment?: { name: string } }).environment?.name
      if (envName !== 'rsc') return

      this.emitFile({
        type: 'chunk',
        id: configPath,
        fileName: 'vocs.config.js',
      })
    },
  }
}
