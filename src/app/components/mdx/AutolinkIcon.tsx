import { assignInlineVars } from '@vanilla-extract/dynamic'
import { clsx } from 'clsx'
import { type DetailedHTMLProps, type ImgHTMLAttributes } from 'react'

import { useConfig } from '../../hooks/useConfig.js'
import * as styles from './AutolinkIcon.css.js'

export function AutolinkIcon(
  props: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
) {
  const { basePath } = useConfig()
  const assetBasePath = import.meta.env.PROD ? basePath : ''
  return (
    <div
      {...props}
      className={clsx(props.className, styles.root)}
      style={assignInlineVars({
        [styles.iconUrl]: `url(${assetBasePath}/.vocs/icons/link.svg)`,
      })}
    />
  )
}
