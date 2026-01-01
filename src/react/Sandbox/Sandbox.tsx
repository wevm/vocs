import redent from 'redent'

import { bundleDependencies } from './bundleDependencies.js'
import { SandboxProvider } from './Provider.js'

export async function Sandbox(props: Sandbox.Props) {
  const {
    code,
    packages = [],
    imports = [],
    editorProps,
    previewProps,
    consoleProps,
    providerProps,
    autoRun = false,
    readOnly = false,
    showConsole = true,
    showPreview = false,
  } = props

  if (!code) return null

  const codeString = redent((typeof code === 'function' ? code() : code).trim())
  const dependencies = Object.fromEntries(packages.map((pkg) => [pkg, 'latest']))
  const bundledFiles = showPreview ? {} : await bundleDependencies(dependencies, codeString)

  return (
    <article>
      <SandboxProvider
        code={codeString}
        autoRun={autoRun}
        readOnly={readOnly}
        showConsole={showConsole}
        showPreview={showPreview}
        bundledFiles={bundledFiles}
        {...(showPreview && imports.length > 0 && { imports })}
        {...(editorProps && { editorProps })}
        {...(previewProps && { previewProps })}
        {...(consoleProps && { consoleProps })}
        {...(providerProps && { providerProps })}
      />
    </article>
  )
}

export declare namespace Sandbox {
  type Props = Omit<SandboxProvider.Props, 'code' | 'bundledFiles'> & {
    imports?: string[]
    packages?: string[]
    code?: (() => string) | string
  }
}
