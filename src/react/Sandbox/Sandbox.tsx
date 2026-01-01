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

  return (
    <article>
      <SandboxProvider
        code={(typeof code === 'function' ? code() : code).trim()}
        deps={deps}
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
  type Props = Partial<SandboxProvider.Props>
}
