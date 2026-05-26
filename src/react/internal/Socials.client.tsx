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
import { useConfig } from '../useConfig.js'

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
    <div className={`vocs:flex vocs:items-center vocs:h-7 ${className ?? ''}`} data-v-socials>
      {socials.map((social, i) => {
        const Icon = icons[social.icon]
        const label = labels[social.icon]
        return (
          <Fragment key={social.link}>
            {i !== 0 && <div className="vocs:w-px vocs:h-4 vocs:bg-primary vocs:mx-1" />}
            <a
              aria-label={label}
              className="vocs:flex vocs:items-center vocs:justify-center vocs:size-7 vocs:text-primary/60 vocs:hover:text-primary vocs:transition-colors vocs:duration-150"
              href={social.link}
              rel="noopener noreferrer"
              target="_blank"
            >
              <Icon className="vocs:size-[18px]" />
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
