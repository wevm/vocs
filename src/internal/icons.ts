import type { IconifyJSON } from '@iconify/types'
import { getIconData, iconToHTML, iconToSVG } from '@iconify/utils'
import { icons as lucideIcons } from '@iconify-json/lucide'
import { icons as simpleIcons } from '@iconify-json/simple-icons'
import { icons as vscodeIcons } from '@iconify-json/vscode-icons'

export const builtinIcons: Record<string, string> = {
  // Package managers
  npm: 'vscode-icons:file-type-npm',
  yarn: 'vscode-icons:file-type-yarn',
  pnpm: 'vscode-icons:file-type-light-pnpm',
  bun: 'vscode-icons:file-type-bun',
  deno: 'vscode-icons:file-type-deno',

  // File extensions
  '.js': 'vscode-icons:file-type-js',
  '.cjs': 'vscode-icons:file-type-js',
  '.mjs': 'vscode-icons:file-type-js',
  '.ts': 'vscode-icons:file-type-typescript',
  '.cts': 'vscode-icons:file-type-typescript',
  '.mts': 'vscode-icons:file-type-typescript',
  '.jsx': 'vscode-icons:file-type-reactjs',
  '.tsx': 'vscode-icons:file-type-reactts',
  '.vue': 'vscode-icons:file-type-vue',
  '.svelte': 'vscode-icons:file-type-svelte',
  '.astro': 'vscode-icons:file-type-astro',
  '.json': 'vscode-icons:file-type-json',
  '.yaml': 'vscode-icons:file-type-yaml',
  '.yml': 'vscode-icons:file-type-yaml',
  '.toml': 'vscode-icons:file-type-toml',
  '.md': 'vscode-icons:file-type-markdown',
  '.mdx': 'vscode-icons:file-type-mdx',
  '.html': 'vscode-icons:file-type-html',
  '.css': 'vscode-icons:file-type-css',
  '.scss': 'vscode-icons:file-type-scss',
  '.sass': 'vscode-icons:file-type-sass',
  '.less': 'vscode-icons:file-type-less',
  '.py': 'vscode-icons:file-type-python',
  '.rb': 'vscode-icons:file-type-ruby',
  '.rs': 'vscode-icons:file-type-rust',
  '.go': 'vscode-icons:file-type-go',
  '.java': 'vscode-icons:file-type-java',
  '.kt': 'vscode-icons:file-type-kotlin',
  '.swift': 'vscode-icons:file-type-swift',
  '.c': 'vscode-icons:file-type-c',
  '.cpp': 'vscode-icons:file-type-cpp',
  '.h': 'vscode-icons:file-type-cheader',
  '.hpp': 'vscode-icons:file-type-cppheader',
  '.cs': 'vscode-icons:file-type-csharp',
  '.php': 'vscode-icons:file-type-php',
  '.sh': 'vscode-icons:file-type-shell',
  '.bash': 'vscode-icons:file-type-shell',
  '.zsh': 'vscode-icons:file-type-shell',
  '.fish': 'vscode-icons:file-type-shell',
  '.sql': 'vscode-icons:file-type-sql',
  '.graphql': 'vscode-icons:file-type-graphql',
  '.gql': 'vscode-icons:file-type-graphql',
  '.xml': 'vscode-icons:file-type-xml',
  '.svg': 'vscode-icons:file-type-svg',
  '.wasm': 'vscode-icons:file-type-wasm',
  '.zig': 'vscode-icons:file-type-zig',
  '.lua': 'vscode-icons:file-type-lua',
  '.ex': 'vscode-icons:file-type-elixir',
  '.exs': 'vscode-icons:file-type-elixir',
  '.erl': 'vscode-icons:file-type-erlang',
  '.hrl': 'vscode-icons:file-type-erlang',
  '.clj': 'vscode-icons:file-type-clojure',
  '.cljs': 'vscode-icons:file-type-clojure',
  '.cljc': 'vscode-icons:file-type-clojure',
  '.edn': 'vscode-icons:file-type-clojure',
  '.scala': 'vscode-icons:file-type-scala',
  '.hs': 'vscode-icons:file-type-haskell',
  '.lhs': 'vscode-icons:file-type-haskell',
  '.nim': 'vscode-icons:file-type-nim',
  '.d': 'vscode-icons:file-type-dlang',
  '.r': 'vscode-icons:file-type-r',
  '.jl': 'vscode-icons:file-type-julia',
  '.f90': 'vscode-icons:file-type-fortran',
  '.f95': 'vscode-icons:file-type-fortran',
  '.f03': 'vscode-icons:file-type-fortran',
  '.png': 'vscode-icons:file-type-image',
  '.jpg': 'vscode-icons:file-type-image',
  '.jpeg': 'vscode-icons:file-type-image',
  '.gif': 'vscode-icons:file-type-image',
  '.webp': 'vscode-icons:file-type-image',
  '.ico': 'vscode-icons:file-type-image',

  // Config files
  'vite.config': 'vscode-icons:file-type-vite',
  'vitest.config': 'vscode-icons:file-type-vitest',
  'nuxt.config': 'vscode-icons:file-type-nuxt',
  'next.config': 'vscode-icons:file-type-next',
  tsconfig: 'vscode-icons:file-type-tsconfig',
  jsconfig: 'vscode-icons:file-type-jsconfig',
  'package.json': 'vscode-icons:file-type-npm',
  'tailwind.config': 'vscode-icons:file-type-tailwind',
  'postcss.config': 'vscode-icons:file-type-postcss',
  '.eslintrc': 'vscode-icons:file-type-eslint',
  'eslint.config': 'vscode-icons:file-type-eslint',
  '.prettierrc': 'vscode-icons:file-type-prettier',
  'prettier.config': 'vscode-icons:file-type-prettier',
  'biome.json': 'vscode-icons:file-type-biome',
  'Cargo.toml': 'vscode-icons:file-type-cargo',
  '.gitignore': 'vscode-icons:file-type-git',
  dockerfile: 'vscode-icons:file-type-docker',
  'docker-compose': 'vscode-icons:file-type-docker',
  '.env': 'vscode-icons:file-type-dotenv',
  'vercel.json': 'vscode-icons:file-type-vercel',
  'netlify.toml': 'vscode-icons:file-type-netlify',

  // Language identifiers (for code blocks without file extensions)
  tsx: 'vscode-icons:file-type-reactts',
  jsx: 'vscode-icons:file-type-reactjs',

  // Frameworks/tools
  vue: 'vscode-icons:file-type-vue',
  react: 'vscode-icons:file-type-reactjs',
  angular: 'vscode-icons:file-type-angular',
  svelte: 'vscode-icons:file-type-svelte',
  astro: 'vscode-icons:file-type-astro',
  nuxt: 'vscode-icons:file-type-nuxt',
  next: 'vscode-icons:file-type-next',
  vite: 'vscode-icons:file-type-vite',
  webpack: 'vscode-icons:file-type-webpack',
  rollup: 'vscode-icons:file-type-rollup',
  esbuild: 'vscode-icons:file-type-esbuild',
  turbopack: 'vscode-icons:file-type-turbo',
  solid: 'vscode-icons:file-type-solid',
  qwik: 'vscode-icons:file-type-qwik',
  remix: 'simple-icons:remix',
  sveltekit: 'vscode-icons:file-type-svelte',
  gatsby: 'vscode-icons:file-type-gatsby',
  docker: 'vscode-icons:file-type-docker',
  kubernetes: 'vscode-icons:file-type-kubernetes',
  terraform: 'vscode-icons:file-type-terraform',
  prisma: 'vscode-icons:file-type-prisma',
  drizzle: 'simple-icons:drizzle',
}

export const sortedBuiltins = Object.entries(builtinIcons).sort(([a], [b]) => b.length - a.length)

const iconSets: Record<string, IconifyJSON> = {
  lucide: lucideIcons,
  'simple-icons': simpleIcons,
  'vscode-icons': vscodeIcons,
}

function matchesKey(filename: string, key: string): boolean {
  const lowerKey = key.toLowerCase()
  // For file extensions (starting with .), use includes
  if (lowerKey.startsWith('.')) return filename.includes(lowerKey)
  // For words, require word boundary (not preceded/followed by a letter)
  const regex = new RegExp(`(?<![a-z])${lowerKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![a-z])`)
  return regex.test(filename)
}

export function matchIcon(
  filename: string,
  customIcons?: Record<string, string>,
): string | undefined {
  const normalizedFilename = filename.toLowerCase()

  if (customIcons) {
    for (const [key, icon] of Object.entries(customIcons)) {
      if (matchesKey(normalizedFilename, key)) return icon
    }
  }

  for (const [key, icon] of sortedBuiltins) {
    if (matchesKey(normalizedFilename, key)) return icon
  }

  return undefined
}

export async function resolveIcon(icon: string): Promise<string | undefined> {
  if (icon.startsWith('<svg')) return icon

  if (/^https?:\/\//.test(icon)) {
    try {
      const response = await fetch(icon)
      if (response.ok) return await response.text()
    } catch {}
    return undefined
  }

  const [collection, iconName] = icon.split(':')
  if (!collection || !iconName) return undefined

  const iconSet = iconSets[collection]
  if (!iconSet) return undefined

  const data = getIconData(iconSet, iconName)
  if (!data) return undefined

  const { attributes, body } = iconToSVG(data)
  return iconToHTML(body, attributes)
}
