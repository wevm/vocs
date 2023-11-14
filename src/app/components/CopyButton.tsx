import * as styles from './CopyButton.css.js'
import { Icon } from './Icon.js'
import { Checkmark } from './icons/Checkmark.js'
import { Copy } from './icons/Copy.js'

export function CopyButton({ copy, copied }: { copy: () => void; copied: boolean }) {
  return (
    <button className={styles.root} onClick={copy} type="button">
      {copied ? (
        <Icon label="Copied" size="14px" icon={Checkmark} />
      ) : (
        <Icon label="Copy" size="18px" icon={Copy} />
      )}
    </button>
  )
}
