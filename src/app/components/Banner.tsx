import { runSync } from '@mdx-js/mdx'
import { Cross1Icon } from '@radix-ui/react-icons'
import { assignInlineVars } from '@vanilla-extract/dynamic'
import clsx from 'clsx'
import { Fragment, useMemo } from 'react'
import * as runtime from 'react/jsx-runtime'

import { useConfig } from '../hooks/useConfig.js'
import { deserializeElement } from '../utils/deserializeElement.js'
import * as styles from './Banner.css.js'

export type BannerProps = {
  hide?: () => void
}

export function Banner({ hide }: BannerProps) {
  const { banner } = useConfig()
  const ConsumerBanner = useMemo(() => {
    const content = banner?.content ?? ''
    if (!content) return null
    if (typeof content !== 'string') return () => deserializeElement(content)
    const { default: MDXBanner } = runSync(content, { ...runtime, Fragment })
    return MDXBanner
  }, [banner])

  if (!ConsumerBanner) return null
  return (
    <div
      className={clsx(styles.root)}
      style={assignInlineVars({
        [styles.bannerBackgroundColor]: banner?.backgroundColor,
        [styles.bannerTextColor]: banner?.textColor,
      })}
    >
      <div className={clsx(styles.inner)}>
        <div className={clsx(styles.content)}>
          <ConsumerBanner />
        </div>
        {banner?.dismissable !== ('false' as unknown as boolean) && (
          <button className={clsx(styles.closeButton)} onClick={hide} type="button">
            <Cross1Icon width={14} height={14} />
          </button>
        )}
      </div>
    </div>
  )
}
