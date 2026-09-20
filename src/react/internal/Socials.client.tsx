'use client'

import type { ComponentType } from 'react'
import { Fragment } from 'react'
import { style, theme } from 'zyzz/default'
import SimpleIconsBluesky from '~icons/simple-icons/bluesky'
import SimpleIconsDiscord from '~icons/simple-icons/discord'
import SimpleIconsFarcaster from '~icons/simple-icons/farcaster'
import SimpleIconsGithub from '~icons/simple-icons/github'
import SimpleIconsTelegram from '~icons/simple-icons/telegram'
import SimpleIconsX from '~icons/simple-icons/x'

import type { SocialType } from '../../internal/config.js'
import { useConfig } from '../useConfig.js'

namespace styles {
  export const socials = style({
    display: 'flex',
    height: 7,
    alignItems: 'center',
  })
  export const socials2 = style({
    marginInline: 1,
    height: 4,
    width: '1px',
    backgroundColor: theme.vars.color.background['200'],
  })
  export const socials3 = style({
    display: 'flex',
    width: 7,
    height: 7,
    alignItems: 'center',
    justifyContent: 'center',
    color: `color-mix(in oklab, ${theme.vars.color.foreground} 60%, transparent)`,
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: { '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } } },
  })
  export const socials4 = style({ width: '18px', height: '18px' })
}

const icons: Record<SocialType, ComponentType<{ className?: string }>> = {
  bluesky: SimpleIconsBluesky,
  discord: SimpleIconsDiscord,
  farcaster: SimpleIconsFarcaster,
  github: SimpleIconsGithub,
  telegram: SimpleIconsTelegram,
  x: SimpleIconsX,
}

const labels: Record<SocialType, string> = {
  bluesky: 'Bluesky',
  discord: 'Discord',
  farcaster: 'Farcaster',
  github: 'GitHub',
  telegram: 'Telegram',
  x: 'X (Twitter)',
}

export function Socials(props: Socials.Props) {
  const { className } = props
  const { socials } = useConfig()

  if (!socials || socials.length === 0) return null

  return (
    <div className={`${styles.socials().className} ${className ?? ''}`} data-v-socials>
      {socials.map((social, i) => {
        const Icon = icons[social.icon]
        const label = labels[social.icon]
        return (
          <Fragment key={social.link}>
            {i !== 0 && <div {...styles.socials2()} />}
            <a
              aria-label={label}
              {...styles.socials3()}
              href={social.link}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon className={styles.socials4().className} />
            </a>
          </Fragment>
        )
      })}
    </div>
  )
}

export declare namespace Socials {
  export type Props = {
    className?: string | undefined
  }
}
