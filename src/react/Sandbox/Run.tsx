'use client'

import { RoundedButton, RunIcon, useSandpack } from '@codesandbox/sandpack-react'
import * as React from 'react'
import { transform } from 'sucrase'

export function RunButton(props: { autoRun: boolean }) {
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
    <div className="vocs:absolute vocs:top-2 vocs:right-2 vocs:flex vocs:gap-1">
      <RoundedButton onClick={transpileAndRun}>
        <RunIcon />
      </RoundedButton>
    </div>
  )
}
