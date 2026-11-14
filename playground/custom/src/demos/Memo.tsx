/**
 * A demo that encodes a memo as the 32-byte hex value a transfer stores. The end-to-end config
 * registers it as `memo`.
 * @module
 */
import * as React from 'react'

export default function Memo() {
  const id = React.useId()
  const [memo, setMemo] = React.useState('invoice 42')
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
