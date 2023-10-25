import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import { useCopyCode } from '../../hooks/useCopyCode.js'
import { Checkmark } from '../svgs/Checkmark.js'
import { Copy } from '../svgs/Copy.js'

export function Pre({
  children,
  ...props
}: DetailedHTMLProps<HTMLAttributes<HTMLPreElement>, HTMLPreElement>) {
  const { copied, copy, ref } = useCopyCode()

  return (
    <pre ref={ref} {...props}>
      <button className="copy" onClick={copy} type="button">
        {copied ? <Checkmark height={14} width={14} /> : <Copy height={18} width={18} />}
      </button>
      {children}
    </pre>
  )
}
