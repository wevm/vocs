/**
 * Spike B Worker. `GET /render/<sample>` renders one code block to HTML and reports the
 * isolate's render count. Shiki uses the JavaScript regex engine. Twoslash runs the
 * TypeScript 6 API (`twoslash-cdn` imports it) and fetches lib and package types from a CDN,
 * cached in isolate memory.
 * @module
 */
import { createTransformerFactory, rendererRich } from '@shikijs/twoslash/core'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import { createTwoslashFromCDN, type TwoslashCdnReturn } from 'twoslash-cdn'
import ts from 'typescript'

const samples = {
  shiki: {
    code: `import { createClient, http } from 'viem'\n\nexport const client = createClient({\n  transport: http('https://rpc.example.com'),\n})\n\nconst block = await client.request({ method: 'eth_blockNumber' })\nconsole.log(BigInt(block))\n`,
    twoslash: false,
  },
  'twoslash-lib': {
    code: `const total = [1, 2, 3].reduce((sum, value) => sum + value, 0)\n//    ^?\nconst label = total.toFixed(2)\n//    ^?\n`,
    twoslash: true,
  },
  'twoslash-viem': {
    code: `import { createClient, http } from 'viem'\n\nconst client = createClient({ transport: http() })\n//    ^?\nconst id = await client.request({ method: 'eth_chainId' })\n//    ^?\n`,
    twoslash: true,
  },
} as const

type Instance = { highlighter: HighlighterCore; renders: number; twoslash: TwoslashCdnReturn }

let instance: Promise<Instance> | undefined

const fetches = { active: 0, bytes: 0, files: 0, queue: [] as ((value: unknown) => void)[] }

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const name = url.pathname.replace('/render/', '') as keyof typeof samples
    const sample = samples[name]
    if (!sample) return new Response('Not found', { status: 404 })

    // One highlighter and one Twoslash cache per isolate, created by the first request.
    instance ??= create()
    const current = await instance

    if (sample.twoslash) await current.twoslash.prepareTypes(sample.code)
    const html = current.highlighter.codeToHtml(sample.code, {
      lang: 'ts',
      theme: 'github-dark',
      transformers: sample.twoslash
        ? [createTransformerFactory(current.twoslash.runSync)({ renderer: rendererRich() })]
        : [],
    })
    current.renders++

    return new Response(html, {
      headers: {
        'content-type': 'text/html',
        'x-fetched-bytes': String(fetches.bytes),
        'x-fetched-files': String(fetches.files),
        'x-renders': String(current.renders),
      },
    })
  },
}

async function create(): Promise<Instance> {
  const highlighter = await createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    langs: [import('shiki/langs/typescript.mjs')],
    themes: [import('shiki/themes/github-dark.mjs')],
  })
  const twoslash = createTwoslashFromCDN({
    compilerOptions: {
      lib: ['esnext', 'dom'],
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ESNext,
    },
    fetcher: async (input, init) => {
      // Type acquisition requests hundreds of files at once. Six at a time keeps connections open.
      while (fetches.active >= 6) await new Promise((resolve) => fetches.queue.push(resolve))
      fetches.active++
      try {
        const response = await fetch(input, init)
        const body = await response.arrayBuffer()
        fetches.files++
        fetches.bytes += body.byteLength
        return new Response(body, response)
      } catch (error) {
        throw new Error(`Fetching ${String(input)} failed: ${String(error)}`)
      } finally {
        fetches.active--
        fetches.queue.shift()?.(undefined)
      }
    },
  })
  return { highlighter, renders: 0, twoslash }
}
