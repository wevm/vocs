import path from 'path'
import { Project } from 'ts-morph'
import { type PluginOption } from 'vite'

export function docgen(): PluginOption {
  const virtualModuleId = 'virtual:docgen'
  const resolvedVirtualModuleId = `\0${virtualModuleId}`

  return {
    name: 'docgen',
    async configureServer(server) {
      const project = new Project({ tsConfigFilePath: 'tsconfig.json' })
      const sourceFiles = project.getSourceFiles()
      if (sourceFiles.length) {
        const rootDirs = new Set<string>()
        for (const sourceFile of sourceFiles) {
          const key = sourceFile
            .getFilePath()
            .replace(`${path.dirname(process.cwd())}/`, '')
            .split('/')[0]
          rootDirs.add(path.resolve(process.cwd(), `../${key}`))
        }

        const watched = server.watcher.getWatched()
        for (const rootDir of rootDirs) {
          if (watched[rootDir]) server.watcher.unwatch(rootDir)
          server.watcher.add(rootDir)
        }

        server.watcher.on('change', () => server.ws.send('vocs:docgen', getFiles()))
      }
    },
    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
      return
    },
    async load(id) {
      if (id !== resolvedVirtualModuleId) return

      const files = getFiles()

      return `export const docgen = ${JSON.stringify(files)}`
    },
  }
}

function getFiles() {
  const project = new Project({ tsConfigFilePath: 'tsconfig.json' })
  const sourceFiles = project.getSourceFiles()

  const files: Record<string, string> = {}
  for (const sourceFile of sourceFiles) {
    const key = sourceFile.getFilePath().replace(`${path.dirname(process.cwd())}/`, '')
    files[key] = sourceFile.getFullText()
  }

  return files
}
