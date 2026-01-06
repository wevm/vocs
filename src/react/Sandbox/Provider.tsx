'use client'

import {
  SandpackConsole,
  SandpackPreview,
  SandpackProvider,
  type SandpackProviderProps,
} from '@codesandbox/sandpack-react'
import * as React from 'react'
import { transform } from 'sucrase'

export function SandboxProvider(props: SandboxProvider.Props) {
  const {
    autoRun,
    code: _code,
    showConsole,
    showPreview,
    bundledFiles,
    previewProps,
    consoleProps,
    providerProps,
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
      options={{
        recompileDelay: 1_000,
        recompileMode: 'delayed',
        autorun: autoRun ?? false,
        experimental_enableServiceWorker: true,
        experimental_enableStableServiceWorkerId: true,
        ...providerProps?.options,
      }}
      files={{
        '/code.ts': { active: true, code },
        '/index.js': { hidden: true, code: transpiledCode },
        ...bundledFiles,
      }}
      customSetup={{
        entry: '/index.js',
      }}
      theme={'auto'}
      className="shiki shiki-themes github-light github-dark-dimmed text-white font-mono tabular-nums text-lg mt-0.5"
      {...providerProps}
    >
      <SandpackPreview
        showOpenInCodeSandbox={false}
        showOpenNewtab={false}
        hidden={!showPreview}
        {...previewProps}
        showRefreshButton={true}
        showRestartButton={false}
      />
      <SandpackConsole
        hidden={!showConsole}
        showSyntaxError={true}
        showHeader={false}
        className="text-white font-mono tabular-nums text-lg mt-0.5"
        {...consoleProps}
        showResetConsoleButton={true}
        showRestartButton={true}
        showSetupProgress={false}
      />
    </SandpackProvider>
  )
}

export declare namespace SandboxProvider {
  export type Props = {
    code: (() => string) | string
    bundledFiles: Record<string, { code: string; hidden: true }>
    showPreview: boolean
    showConsole: boolean
    autoRun?: boolean
    previewProps?: React.ComponentPropsWithoutRef<typeof SandpackPreview>
    consoleProps?: React.ComponentPropsWithoutRef<typeof SandpackConsole>
    providerProps?: Pick<
      SandpackProviderProps,
      'title' | 'theme' | 'teamId' | 'template' | 'options'
    >
  }
}
