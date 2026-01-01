'use client'

import { RoundedButton, RunIcon, useSandpack } from '@codesandbox/sandpack-react'
import * as React from 'react'
import { transform } from 'sucrase'

export function RunButton(props: { autoRun: boolean }) {
  const { autoRun } = props
  const { sandpack } = useSandpack()
  const [hasRun, setHasRun] = React.useState(autoRun)

  const run = React.useCallback(() => {
    const tsCode = sandpack.files['/index.ts']?.code ?? sandpack.files['/App.tsx']?.code
    if (tsCode) {
      try {
        sandpack.updateFile('/index.js', transform(tsCode, { transforms: ['typescript'] }).code)
      } catch {}
    }
    sandpack.runSandpack()
    setHasRun(true)
  }, [sandpack])

  if (hasRun && autoRun) return null

  return (
    <div className="vocs:absolute vocs:top-2 vocs:right-2 vocs:flex vocs:gap-1">
      <RoundedButton onClick={run}>
        <RunIcon />
      </RoundedButton>
    </div>
  )
}
