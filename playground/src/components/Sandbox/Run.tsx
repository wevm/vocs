'use client'

import { useSandpack } from '@codesandbox/sandpack-react'
import { useCallback } from 'react'
import { transform } from 'sucrase'

export function RunButton() {
  const { sandpack } = useSandpack()

  const handleRun = useCallback(() => {
    const tsCode = sandpack.files['/code.ts']?.code
    if (!tsCode) return

    try {
      const transpiled = transform(tsCode, { transforms: ['typescript'] }).code
      sandpack.updateFile('/index.js', transpiled)
      sandpack.runSandpack()
    } catch {}
  }, [sandpack])

  return (
    <button
      type="button"
      onClick={handleRun}
      className="vocs:top-2 vocs:right-2 vocs:z-10 vocs:text-current/90 vocs:hover:text-current vocs:absolute vocs:text-sm vocs:font-medium vocs:cursor-pointer vocs:rounded-sm vocs:border-none"
    >
      <span className="vocs:sr-only">Run</span>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="vocs:size-5">
        <title>Run</title>
        <path
          fill="currentColor"
          d="M8 17.175V6.825q0-.425.3-.713t.7-.287q.125 0 .263.037t.262.113l8.15 5.175q.225.15.338.375t.112.475-.112.475-.338.375l-8.15 5.175q-.125.075-.262.113T9 18.175q-.4 0-.7-.288t-.3-.712"
        />
      </svg>
    </button>
  )
}
