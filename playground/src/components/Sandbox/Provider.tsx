'use client'

import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackPreview,
  SandpackProvider,
  type SandpackProviderProps,
} from '@codesandbox/sandpack-react'
import * as React from 'react'
import { transform } from 'sucrase'
import { RunButton } from './Run.tsx'

export function SandboxProvider(props: SandboxProvider.Props) {
  const {
    code: _code,
    deps,
    editorProps,
    previewProps,
    consoleProps,
    providerProps,
    showConsole,
    showPreview,
    autoRun,
  } = props

  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])

  const code = typeof _code === 'function' ? _code() : _code
  const transpiledCode = React.useMemo(() => {
    try {
      return transform(code, { transforms: ['typescript'] }).code
    } catch {
      return code
    }
  }, [code])

  if (!mounted) return null

  return (
    <SandpackProvider
      template={'node'}
      options={{ autorun: autoRun, ...providerProps?.options }}
      files={{
        '/code.ts': { active: true, code },
        '/index.js': { hidden: true, code: transpiledCode },
      }}
      customSetup={{
        entry: '/index.js',
        dependencies: deps,
        npmRegistries: [
          {
            limitToScopes: false,
            enabledScopes: ['*'],
            proxyEnabled: true,
            registryUrl: 'https://registry.npmjs.org',
          },
          {
            limitToScopes: false,
            enabledScopes: ['*'],
            proxyEnabled: true,
            registryUrl: 'https://esm.sh',
          },
        ],
      }}
      theme="auto"
      {...providerProps}
    >
      <div style={{ position: 'relative' }}>
        <SandpackCodeEditor
          showInlineErrors={true}
          showLineNumbers={true}
          showTabs={true}
          showRunButton={false}
          {...editorProps}
        />
        <RunButton />
      </div>
      <SandpackPreview
        showOpenInCodeSandbox={false}
        showRefreshButton={false}
        showRestartButton={false}
        showOpenNewtab={false}
        hidden={!showPreview}
        {...previewProps}
      />
      <SandpackConsole
        hidden={!showConsole}
        showResetConsoleButton={false}
        showRestartButton={false}
        showSetupProgress={false}
        showSyntaxError={false}
        showHeader={false}
        className="vocs:text-white vocs:font-mono vocs:tabular-nums vocs:text-lg vocs:mt-0.5"
        {...consoleProps}
      />
    </SandpackProvider>
  )
}

export declare namespace SandboxProvider {
  export type Props = {
    code: (() => string) | string
    deps: Record<string, string>
    showPreview: boolean
    showConsole: boolean
    autoRun?: boolean
    editorProps?: React.ComponentPropsWithoutRef<typeof SandpackCodeEditor>
    previewProps?: React.ComponentPropsWithoutRef<typeof SandpackPreview>
    consoleProps?: React.ComponentPropsWithoutRef<typeof SandpackConsole>
    providerProps?: Pick<
      SandpackProviderProps,
      'title' | 'theme' | 'teamId' | 'template' | 'options'
    >
  }
}
