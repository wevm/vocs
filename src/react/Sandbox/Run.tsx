'use client'

import { RoundedButton, RunIcon, useSandpack } from '@codesandbox/sandpack-react'
import * as React from 'react'
import { transform } from 'sucrase'
import { style } from '../../styles/zyzz.config.js'

namespace styles {
  export const button = style({
    position: 'absolute',
    top: '2',
    right: '2',
    display: 'flex',
    gap: '1',
  })
}

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
    <div {...styles.button()}>
      <RoundedButton onClick={transpileAndRun}>
        <RunIcon />
      </RoundedButton>
    </div>
  )
}
