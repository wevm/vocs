import * as styles from './CopyButton.css.js'
import { Icon } from './Icon.js'

export function CopyButton({ copy, copied }: { copy: () => void; copied: boolean }) {
  return (
    <button className={styles.root} onClick={copy} type="button">
      {copied ? (
        <Icon label="Copied" size="14px" src="/.vocs/icons/checkmark.svg" />
      ) : (
        <Icon label="Copy" size="18px" src="/.vocs/icons/copy.svg" />
      )}
    </button>
  )
}
