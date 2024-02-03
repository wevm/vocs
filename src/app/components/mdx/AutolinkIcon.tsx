import { clsx } from 'clsx'
import { type DetailedHTMLProps, type ImgHTMLAttributes } from 'react'

import * as styles from './AutolinkIcon.css.js'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import { getImgUrlWithBase } from '../../utils/getImgUrlWithBase.js'
import { useConfig } from '../../hooks/useConfig.js'

export function AutolinkIcon(
  props: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
) {
  const { baseUrl } = useConfig()
  return <div {...props} className={clsx(props.className, styles.root)} style={assignInlineVars({
    [styles.mask]: `url(${getImgUrlWithBase('/.vocs/icons/link.svg', baseUrl)}) no-repeat center / contain`
  })} />
}
