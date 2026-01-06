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
    <article data-v-sandbox>
      <div data-v-code-container>
        <CodeToHtml code={codeStr} lang={lang} />
      </div>
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
    </article>
  )
}

export declare namespace Sandbox {
  type Props = Omit<SandboxProvider.Props, 'children'> & {
    lang?: string
    deps?: Record<string, string>
  }
}
