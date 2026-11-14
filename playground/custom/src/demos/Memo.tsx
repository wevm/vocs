/**
 * A demo that encodes a memo as the 32-byte hex value a transfer stores. The end-to-end config
 * registers it as `memo`, with a schema for its `memo` prop.
 * @module
 */
import * as React from 'react'

export default function Memo(props: Memo.Props) {
  const id = React.useId()
  const [memo, setMemo] = React.useState(props.memo)
  const bytes = new TextEncoder().encode(memo)
  return (
    <div>
      <label htmlFor={id}>Memo</label>{' '}
      <input id={id} onChange={(event) => setMemo(event.target.value)} value={memo} />
      <output htmlFor={id}>
        {bytes.length > 32
          ? 'The memo is longer than 32 bytes.'
          : `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
              .join('')
              .padEnd(64, '0')}`}
      </output>
    </div>
  )
}

declare namespace Memo {
  type Props = {
    /** The memo the demo starts with. */
    memo: string
  }
}
