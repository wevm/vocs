/**
 * Fetches and bundles dependencies from esm.sh at build/SSR time.
 */
export async function bundleDependencies(
  dependencies: Record<string, string>,
  code: string,
): Promise<Record<string, { code: string; hidden: true }>> {
  const importPaths = extractImports(code)
  const toFetch = buildFetchList(importPaths, dependencies)

  const results = await Promise.all(
    toFetch.map(async ({ pkg, version, subpath }) => {
      const { resolvedVersion, bundleCode } = await fetchEsmBundle(pkg, version, subpath)
      return { pkg, subpath, resolvedVersion, bundleCode }
    }),
  )

  const files: Record<string, { code: string; hidden: true }> = {}
  for (const { pkg, subpath, resolvedVersion, bundleCode } of results) {
    if (subpath) {
      files[`/node_modules/${pkg}/${subpath}.js`] = { code: bundleCode, hidden: true }
    } else {
      files[`/node_modules/${pkg}/package.json`] = {
        code: JSON.stringify(
          { name: pkg, version: resolvedVersion, main: './index.js', type: 'module' },
          null,
          2,
        ),
        hidden: true,
      }
      files[`/node_modules/${pkg}/index.js`] = { code: bundleCode, hidden: true }
    }
  }

  return files
}

function extractImports(code: string): string[] {
  const imports: string[] = []
  const regex = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g
  for (const match of code.matchAll(regex)) {
    const path = match[1]
    if (path && !path.startsWith('.') && !path.startsWith('/')) imports.push(path)
  }
  return [...new Set(imports)]
}

function buildFetchList(
  importPaths: string[],
  dependencies: Record<string, string>,
): { pkg: string; version: string; subpath?: string }[] {
  const list: { pkg: string; version: string; subpath?: string }[] = []
  for (const importPath of importPaths) {
    for (const [name, version] of Object.entries(dependencies)) {
      if (importPath === name) {
        list.push({ pkg: name, version })
      } else if (importPath.startsWith(`${name}/`)) {
        list.push({ pkg: name, version, subpath: importPath.slice(name.length + 1) })
      }
    }
  }
  return list
}

async function fetchEsmBundle(
  name: string,
  version: string,
  subpath?: string,
): Promise<{ resolvedVersion: string; bundleCode: string }> {
  const spec = subpath ? `${name}@${version}/${subpath}` : `${name}@${version}`
  const response = await fetch(`https://esm.sh/${spec}?bundle`)
  if (!response.ok) throw new Error(`Failed to fetch ${spec}: ${response.status}`)

  const esmPath = response.headers.get('x-esm-path')
  const resolvedVersion = esmPath?.match(new RegExp(`/${name}@([^/]+)/`))?.[1] ?? version

  let bundleCode = esmPath
    ? await (await fetch(`https://esm.sh${esmPath}`)).text()
    : await response.text()

  bundleCode = bundleCode.replace(/from\s*["'](\/[^"']+)["']/g, 'from "https://esm.sh$1"')
  bundleCode = bundleCode.replace(/import\s*["'](\/[^"']+)["']/g, 'import "https://esm.sh$1"')

  return { resolvedVersion, bundleCode }
}
