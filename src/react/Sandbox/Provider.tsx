'use client'

import { SandpackLogLevel } from '@codesandbox/sandpack-client'
import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackPreview,
  SandpackProvider,
  type SandpackProviderProps,
} from '@codesandbox/sandpack-react'
import * as React from 'react'
import redent from 'redent'
import { transform } from 'sucrase'

import { indexHtml } from './index.html.js'
import { RunButton } from './Run.js'

export function SandboxProvider(props: SandboxProvider.Props) {
  const {
    code: rawCode,
    bundledFiles,
    imports,
    editorProps,
    previewProps,
    consoleProps,
    providerProps,
    showConsole = true,
    showPreview,
    autoRun = false,
    readOnly = false,
  } = props

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const code = useAutoInjectReact(rawCode)
  const importMap = useImportMap(showPreview, imports)
  const indexHtmlContent = React.useMemo(
    () => indexHtml({ importMap: JSON.stringify(importMap, null, 2) }),
    [importMap],
  )
  const transpiledCode = useTranspiledCode(code, showPreview)

  if (!mounted) return null

  const template = showPreview ? 'static' : 'node'
  const files = showPreview
    ? {
        '/App.tsx': { active: true, code, readOnly },
        '/index.js': { hidden: true, code: createReactEntryScript(importMap) },
        '/index.html': { hidden: true, code: indexHtmlContent },
        ...bundledFiles,
      }
    : {
        '/index.ts': { active: true, code },
        '/index.js': { hidden: true, code: transpiledCode },
        ...bundledFiles,
      }

  return (
    <SandpackProvider
      files={files}
      theme="auto"
      template={template}
      customSetup={showPreview ? {} : { entry: '/index.js' }}
      options={{
        autorun: autoRun,
        recompileDelay: 1_000,
        initMode: 'immediate',
        recompileMode: 'delayed',
        experimental_enableServiceWorker: true,
        experimental_enableStableServiceWorkerId: true,
        logLevel: import.meta.env.DEV ? SandpackLogLevel.Debug : SandpackLogLevel.Info,
        ...providerProps?.options,
      }}
      className="shiki shiki-themes github-light github-dark-dimmed text-white font-mono tabular-nums text-lg mt-0.5"
      {...providerProps}
    >
      <div className="vocs:flex vocs:flex-col">
        <div className="vocs:relative">
          <SandpackCodeEditor
            showTabs
            wrapContent={false}
            showReadOnly={false}
            showRunButton={false}
            showLineNumbers
            showInlineErrors
            {...editorProps}
          />
          <RunButton autoRun={autoRun} />
        </div>
        {showPreview ? (
          <PreviewConsoleTabs
            {...(previewProps && { previewProps })}
            {...(consoleProps && { consoleProps })}
          />
        ) : (
          <>
            <SandpackPreview style={{ display: 'none' }} />
            {showConsole && (
              <SandpackConsole
                showHeader={false}
                showSyntaxError
                showRestartButton
                showSetupProgress={false}
                showResetConsoleButton
                className="vocs:h-full"
                {...consoleProps}
              />
            )}
          </>
        )}
      </div>
    </SandpackProvider>
  )
}

export declare namespace SandboxProvider {
  type Props = {
    code: string
    bundledFiles: Record<string, { code: string; hidden: true }>
    imports?: string[]
    showPreview: boolean
    showConsole: boolean
    autoRun?: boolean
    readOnly?: boolean
    editorProps?: React.ComponentPropsWithoutRef<typeof SandpackCodeEditor>
    previewProps?: React.ComponentPropsWithoutRef<typeof SandpackPreview>
    consoleProps?: React.ComponentPropsWithoutRef<typeof SandpackConsole>
    providerProps?: Pick<
      SandpackProviderProps,
      'title' | 'theme' | 'teamId' | 'template' | 'options'
    >
  }
}

function useAutoInjectReact(rawCode: string) {
  return React.useMemo(() => {
    const usesReactPrefix = /\bReact\./.test(rawCode)
    const hasReactImport = /import\s+(\*\s+as\s+)?React/.test(rawCode)
    if (usesReactPrefix && !hasReactImport) return `import * as React from 'react'\n${rawCode}`
    return rawCode
  }, [rawCode])
}

function useImportMap(showPreview: boolean, imports?: string[]) {
  return React.useMemo(() => {
    if (!showPreview) return { imports: {} }

    const externalParam = '?external=react,react-dom'
    const map: Record<string, string> = {
      react: 'https://esm.sh/react',
      'react/': 'https://esm.sh/react/',
      'react-dom': 'https://esm.sh/react-dom?external=react',
      'react-dom/': 'https://esm.sh/react-dom&external=react/',
      'react-dom/client': 'https://esm.sh/react-dom/client?external=react',
    }

    for (const importPath of imports ?? []) {
      if (!map[importPath]) map[importPath] = `https://esm.sh/${importPath}${externalParam}`
    }

    return { imports: map }
  }, [showPreview, imports])
}

function useTranspiledCode(code: string, showPreview: boolean) {
  return React.useMemo(() => {
    if (showPreview) return ''
    try {
      return transform(code, { transforms: ['typescript'] }).code
    } catch {
      return code
    }
  }, [code, showPreview])
}

type TabType = 'preview' | 'console'

function PreviewConsoleTabs(props: {
  previewProps?: React.ComponentPropsWithoutRef<typeof SandpackPreview>
  consoleProps?: React.ComponentPropsWithoutRef<typeof SandpackConsole>
}) {
  const { previewProps, consoleProps } = props
  const [activeTab, setActiveTab] = React.useState<TabType>('preview')

  const tabClass = (tab: TabType) =>
    `vocs:px-4 vocs:py-2 vocs:text-sm vocs:font-medium vocs:transition-colors ${
      activeTab === tab
        ? 'vocs:text-white vocs:border-b-2 vocs:border-blue-500'
        : 'vocs:text-gray-400 vocs:hover:text-gray-200'
    }`

  return (
    <div className="vocs:flex vocs:flex-col">
      <div className="vocs:flex vocs:border-b vocs:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={tabClass('preview')}
        >
          Preview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('console')}
          className={tabClass('console')}
        >
          Console
        </button>
      </div>
      <SandpackPreview
        hidden={activeTab !== 'preview'}
        showOpenNewtab={false}
        showRefreshButton
        showRestartButton={false}
        showOpenInCodeSandbox={false}
        {...previewProps}
      />
      <SandpackConsole
        hidden={activeTab !== 'console'}
        showHeader={false}
        showSyntaxError
        showRestartButton
        showSetupProgress={false}
        showResetConsoleButton
        className="vocs:text-black vocs:dark:text-white vocs:font-mono vocs:tabular-nums vocs:text-lg"
        {...consoleProps}
      />
    </div>
  )
}

function createReactEntryScript(importMap: { imports: Record<string, string> }) {
  return redent(/* js */ `
    import { createElement } from 'react'
    import { createRoot } from 'react-dom/client'
    import init, { transform } from 'https://esm.sh/@esm.sh/tsx'

    const importMap = ${JSON.stringify(importMap, null, 2)}

    ;(async () => {
      await init()

      const response = await fetch('./App.tsx')
      if (!response.ok) throw new Error('Failed to fetch App.tsx')

      const result = transform({
        importMap,
        filename: '/App.tsx',
        code: await response.text(),
      })

      const blob = new Blob([result.code], { type: 'application/javascript' })
      const url = URL.createObjectURL(blob)
      const { default: App } = await import(url)
      URL.revokeObjectURL(url)

      const element = document.querySelector('main#root')
      if (!element) throw new Error('Root element not found')

      createRoot(element).render(createElement(App))
    })().catch(console.error)
  `)
}
