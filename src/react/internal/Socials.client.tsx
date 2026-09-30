'use client'

import type { ComponentType } from 'react'
import { Fragment } from 'react'
import SimpleIconsBluesky from '~icons/simple-icons/bluesky'
import SimpleIconsDiscord from '~icons/simple-icons/discord'
import SimpleIconsFarcaster from '~icons/simple-icons/farcaster'
import SimpleIconsGithub from '~icons/simple-icons/github'
import SimpleIconsTelegram from '~icons/simple-icons/telegram'
import SimpleIconsX from '~icons/simple-icons/x'
import type { SocialType } from '../../internal/config.js'
import { style, vars } from '../../styles/zyzz.config.js'
import { useConfig } from '../useConfig.js'

namespace styles {
  export const divider = style({
    marginInline: '1',
    height: '4',
    width: '1px !custom',
    backgroundColor: 'primary',
  })

  export const link = style({
    display: 'flex',
    width: '7',
    height: '7',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'primary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.primary} 60%, transparent) !custom`,
    },
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: '150ms !custom',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'primary',
        },
      },
    },
  })

  export const icon = style({
    width: '18px !custom',
    height: '18px !custom',
  })

  export const root = style({
    display: 'flex',
    height: '7',
    alignItems: 'center',
  })
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
    <div {...styles.root({ className })} data-v-socials>
      {socials.map((social, i) => {
        const Icon = icons[social.icon]
        const label = labels[social.icon]
        return (
          <Fragment key={social.link}>
            {i !== 0 && <div {...styles.divider()} />}
            <a
              aria-label={label}
              {...styles.link()}
              href={social.link}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon {...styles.icon()} />
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
