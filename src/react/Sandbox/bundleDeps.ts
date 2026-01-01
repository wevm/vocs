/**
 * Fetches and bundles dependencies from esm.sh at build/SSR time.
 * Parses imports from code and fetches corresponding bundles.
 */
export async function bundleDeps(
  deps: Record<string, string>,
  code: string,
): Promise<Record<string, { code: string; hidden: true }>> {
  const files: Record<string, { code: string; hidden: true }> = {}
  const importPaths = extractImports(code)

  const toFetch: { pkg: string; version: string; subpath?: string }[] = []

  for (const importPath of importPaths) {
    for (const [name, version] of Object.entries(deps)) {
      if (importPath === name) toFetch.push({ pkg: name, version })
      else if (importPath.startsWith(`${name}/`)) {
        const subpath = importPath.slice(name.length + 1)
        toFetch.push({ pkg: name, version, subpath })
      }
    }
  }

  const results = await Promise.all(
    toFetch.map(async ({ pkg, version, subpath }) => {
      const { resolvedVersion, bundleCode } = await fetchEsmBundle(pkg, version, subpath)
      return { pkg, subpath, resolvedVersion, bundleCode }
    }),
  )

  for (const { pkg, subpath, resolvedVersion, bundleCode } of results) {
    if (!subpath) {
      files[`/node_modules/${pkg}/package.json`] = {
        code: JSON.stringify(
          { name: pkg, version: resolvedVersion, main: './index.js', type: 'module' },
          null,
          2,
        ),
        hidden: true,
      }
      files[`/node_modules/${pkg}/index.js`] = { code: bundleCode, hidden: true }
    } else {
      files[`/node_modules/${pkg}/${subpath}.js`] = { code: bundleCode, hidden: true }
    }
  }

  return files
}

function extractImports(code: string): string[] {
  const imports: string[] = []
  for (const match of code.matchAll(/import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g)) {
    const path = match[1]
    if (path && !path.startsWith('.') && !path.startsWith('/')) {
      imports.push(path)
    }
  }
  return [...new Set(imports)]
}

async function fetchEsmBundle(
  name: string,
  version: string,
  subpath?: string,
): Promise<{ resolvedVersion: string; bundleCode: string }> {
  const spec = subpath ? `${name}@${version}/${subpath}` : `${name}@${version}`
  const res = await fetch(`https://esm.sh/${spec}?bundle`)
  if (!res.ok) throw new Error(`Failed to fetch ${spec}: ${res.status}`)

  const esmPath = res.headers.get('x-esm-path')
  const resolvedVersion = esmPath?.match(new RegExp(`/${name}@([^/]+)/`))?.[1] ?? version

  let bundleCode = esmPath
    ? await (await fetch(`https://esm.sh${esmPath}`)).text()
    : await res.text()

  // Rewrite absolute esm.sh paths to full URLs
  bundleCode = bundleCode.replace(/from\s*["'](\/[^"']+)["']/g, 'from "https://esm.sh$1"')
  bundleCode = bundleCode.replace(/import\s*["'](\/[^"']+)["']/g, 'import "https://esm.sh$1"')

  return { resolvedVersion, bundleCode }
}
