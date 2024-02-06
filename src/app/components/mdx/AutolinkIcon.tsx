import { clsx } from 'clsx'
import { type DetailedHTMLProps, type ImgHTMLAttributes } from 'react'

import { assignInlineVars } from '@vanilla-extract/dynamic'
import { useConfig } from '../../hooks/useConfig.js'
import { getSrcPrefixInDotVoc } from '../../utils/rewriteConfig.js'
import * as styles from './AutolinkIcon.css.js'

export function AutolinkIcon(
  props: DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
) {
  const { baseUrl } = useConfig()

  return (
    <div
      {...props}
      className={clsx(props.className, styles.root)}
      style={{
        ...props?.style,
        ...assignInlineVars({
          [styles.mask]: `url(${getSrcPrefixInDotVoc(
            baseUrl,
          )}/.vocs/icons/link.svg) no-repeat center / contain`,
        }),
      }}
    />
  )
}
