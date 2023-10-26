import { Checkmark } from './svgs/Checkmark.js'
import { Copy } from './svgs/Copy.js'

import styles from './CopyButton.module.css'

export function CopyButton({ copy, copied }: { copy: () => void; copied: boolean }) {
  return (
    <button className={styles.root} onClick={copy} type="button">
      {copied ? <Checkmark height={14} width={14} /> : <Copy height={18} width={18} />}
    </button>
  )
}
