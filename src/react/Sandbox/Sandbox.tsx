import { CodeToHtml } from '../internal/CodeToHtml.js'
import { bundleDeps } from './bundleDeps.js'
import { SandboxProvider } from './Provider.js'

export async function Sandbox(props: Sandbox.Props) {
  const {
    code,
    lang = 'ts',
    deps = {},
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
    <section data-v-sandbox>
      <div data-v-code-container className="vocs:gap-y-0.5">
        <CodeToHtml code={codeStr} lang={lang} />
        <SandboxProvider
          code={codeStr}
          autoRun={autoRun}
          showConsole={showConsole}
          showPreview={showPreview}
          bundledFiles={bundledFiles}
          {...(previewProps && { previewProps })}
          {...(consoleProps && { consoleProps })}
          {...(providerProps && { providerProps })}
        />
      </div>
    </section>
  )
}

export declare namespace Sandbox {
  type Props = Omit<SandboxProvider.Props, 'children'> & {
    lang?: string
    deps?: Record<string, string>
  }
}
