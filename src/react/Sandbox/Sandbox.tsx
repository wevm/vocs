import { bundleDeps } from './bundleDeps.js'
import { SandboxProvider } from './Provider.js'

export async function Sandbox(props: Sandbox.Props) {
  const {
    code,
    deps = {},
    editorProps,
    previewProps,
    consoleProps,
    providerProps,
    autoRun = false,
    showConsole = true,
    showPreview = false,
  } = props

  if (!code) return null

  const codeStr = (typeof code === 'function' ? code() : code).trim()
  const bundledFiles = await bundleDeps(deps, codeStr)

  return (
    <article>
      <SandboxProvider
        code={codeStr}
        bundledFiles={bundledFiles}
        showConsole={showConsole}
        showPreview={showPreview}
        autoRun={autoRun}
        {...(editorProps && { editorProps })}
        {...(previewProps && { previewProps })}
        {...(consoleProps && { consoleProps })}
        {...(providerProps && { providerProps })}
      />
    </article>
  )
}

export declare namespace Sandbox {
  type Props = SandboxProvider.Props & {
    deps?: Record<string, string>
  }
}
