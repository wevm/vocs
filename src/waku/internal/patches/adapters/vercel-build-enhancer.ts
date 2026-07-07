import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { gzipSync } from 'node:zlib'
import { aiUserAgents, terminalUserAgents } from '../../../../internal/markdown-negotiation.js'

export type BuildOptions = {
  assetsDir: string
  distDir: string
  rscBase: string
  privateDir: string
  basePath: string
  DIST_PUBLIC: string
  serverless: boolean
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const buildMetadataFile = '__waku_build_metadata.js'

/**
 * Rewrites Waku's build metadata (inlined RSC payloads, can be tens of MB)
 * into a gzipped sidecar plus a tiny loader to shrink serverless bundles.
 */
function compressBuildMetadata(serverDir: string) {
  const file = path.join(serverDir, buildMetadataFile)
  if (!existsSync(file)) return
  const code = readFileSync(file, 'utf-8')
  const match = code.match(/^export const buildMetadata = new Map\((.*)\);\s*$/s)
  const json = match?.[1]
  if (!json) return
  try {
    if (!Array.isArray(JSON.parse(json))) return
  } catch {
    return
  }
  const gzFile = '__waku_build_metadata.json.gz'
  writeFileSync(path.join(serverDir, gzFile), gzipSync(json, { level: 9 }))
  writeFileSync(
    file,
    [
      `import { readFileSync } from 'node:fs';`,
      `import { gunzipSync } from 'node:zlib';`,
      `export const buildMetadata = new Map(JSON.parse(gunzipSync(readFileSync(new URL('./${gzFile}', import.meta.url))).toString('utf8')));`,
      '',
    ].join('\n'),
  )
}

function markdownRoutes({
  assetsDir,
  basePath,
  rscBase,
}: Pick<BuildOptions, 'assetsDir' | 'basePath' | 'rscBase'>) {
  const destination = basePath + rscBase + '/'
  const markdownSource = `^${basePath}(?!${assetsDir}/)(.*\\.md)$`
  const cleanPageSource = `^${basePath}(?!${assetsDir}/)(?!.*\\.[^/]+$)(.*)$`
  const markdownUserAgentPattern = `.*(?:${[...aiUserAgents, ...terminalUserAgents]
    .map(escapeRegExp)
    .join('|')}).*`

  return {
    // Vercel's filesystem handler would serve prerendered HTML before mdRouter sees
    // the request. Route markdown-eligible clean URLs to RSC first so mdRouter can
    // choose markdown or HTML.
    beforeFilesystem: [
      {
        src: cleanPageSource,
        has: [{ type: 'header', key: 'accept', value: '.*text/markdown.*' }],
        dest: destination,
      },
      {
        src: cleanPageSource,
        has: [{ type: 'header', key: 'user-agent', value: markdownUserAgentPattern }],
        dest: destination,
      },
    ],
    // `.md` URLs reach RSC only after the filesystem handler misses, so `public/*.md`
    // files are served as-is. Markdown twins live at `/assets/md/`, never in the
    // static output root, so they still fall through to twin resolution.
    afterFilesystem: [
      {
        src: markdownSource,
        dest: destination,
      },
    ],
  }
}

async function postBuild({
  assetsDir,
  distDir,
  rscBase,
  privateDir,
  basePath,
  DIST_PUBLIC,
  serverless,
}: BuildOptions) {
  const SERVE_JS = 'serve-vercel.js'
  const serveCode = `
import { INTERNAL_runFetch } from './server/index.js';

const getRequestListener = globalThis.__WAKU_HONO_NODE_SERVER_GET_REQUEST_LISTENER__;

export default getRequestListener(
  (req, ...args) => INTERNAL_runFetch(process.env, req, ...args)
);
`
  const publicDir = path.resolve(distDir, DIST_PUBLIC)
  const outputDir = path.resolve('.vercel', 'output')
  const staticDir = path.join(outputDir, 'static')

  mkdirSync(outputDir, { recursive: true })
  rmSync(staticDir, { recursive: true, force: true })
  cpSync(publicDir, staticDir, { recursive: true })

  if (serverless) {
    const serverlessDir = path.join(outputDir, 'functions', `${rscBase}.func`)
    const functionDistDir = path.join(serverlessDir, distDir)

    rmSync(serverlessDir, { recursive: true, force: true })
    mkdirSync(functionDistDir, { recursive: true })
    writeFileSync(path.resolve(distDir, SERVE_JS), serveCode)
    compressBuildMetadata(path.resolve(distDir, 'server'))
    cpSync(path.resolve(distDir, 'server'), path.join(functionDistDir, 'server'), {
      recursive: true,
    })
    cpSync(path.resolve(distDir, SERVE_JS), path.join(functionDistDir, SERVE_JS))

    if (existsSync(path.resolve(privateDir))) {
      cpSync(path.resolve(privateDir), path.join(serverlessDir, privateDir), {
        recursive: true,
        dereference: true,
      })
    }

    const vcConfigJson = {
      runtime: 'nodejs22.x',
      handler: `${distDir}/${SERVE_JS}`,
      launcherType: 'Nodejs',
    }
    writeFileSync(
      path.join(serverlessDir, '.vc-config.json'),
      JSON.stringify(vcConfigJson, null, 2),
    )
    writeFileSync(
      path.join(serverlessDir, 'package.json'),
      JSON.stringify({ type: 'module' }, null, 2),
    )
  }

  const markdown = markdownRoutes({ assetsDir, basePath, rscBase })
  const routes = [
    {
      src: `^${basePath}${assetsDir}/(.*)$`,
      headers: {
        'cache-control': 'public, immutable, max-age=31536000',
      },
    },
    ...(serverless
      ? [
          ...markdown.beforeFilesystem,
          { handle: 'filesystem' },
          ...markdown.afterFilesystem,
          {
            src: basePath + '(.*)',
            dest: basePath + rscBase + '/',
          },
        ]
      : []),
  ]
  const configJson = { version: 3, routes }
  writeFileSync(path.join(outputDir, 'config.json'), JSON.stringify(configJson, null, 2))
}

export default async function buildEnhancer(
  build: (utils: unknown, options: BuildOptions) => Promise<void>,
): Promise<typeof build> {
  return async (utils: unknown, options: BuildOptions) => {
    await build(utils, options)
    await postBuild(options)
  }
}
