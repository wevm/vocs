'use client'

import { RoundedButton, RunIcon, useSandpack } from '@codesandbox/sandpack-react'
import * as React from 'react'
import { transform } from 'sucrase'

export function RunButton(props: RunButton.Props) {
  const { autoRun } = props
  const { sandpack } = useSandpack()
  const [hasRun, setHasRun] = React.useState(autoRun)

  const transpileAndRun = React.useCallback(() => {
    const tsCode = sandpack.files['/code.ts']?.code
    if (!tsCode) return

    try {
      const transpiled = transform(tsCode, { transforms: ['typescript'] }).code
      sandpack.updateFile('/index.js', transpiled)
      sandpack.runSandpack()
      setHasRun(true)
    } catch {}
  }, [sandpack])

  if (hasRun && autoRun) return null

  return (
    <RoundedButton onClick={transpileAndRun}>
      <RunIcon />
    </RoundedButton>
  )
}

export declare namespace RunButton {
  type Props = {
    autoRun: boolean
  }
}
