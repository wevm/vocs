import { type ComponentType, Fragment } from 'react'
import type { ParsedSocialItem } from '../../config.js'
import { useConfig } from '../hooks/useConfig.js'
import { primitiveColorVars, spaceVars } from '../styles/vars.css.js'
import { Icon } from './Icon.js'
import { Bluesky } from './icons/Bluesky.js'
import { Discord } from './icons/Discord.js'
import { Farcaster } from './icons/Farcaster.js'
import { GitHub } from './icons/GitHub.js'
import { Telegram } from './icons/Telegram.js'
import { Warpcast } from './icons/Warpcast.js'
import { X } from './icons/X.js'
import * as styles from './Socials.css.js'

const iconsForIcon = {
  bluesky: Bluesky,
  discord: Discord,
  farcaster: Farcaster,
  github: GitHub,
  telegram: Telegram,
  warpcast: Warpcast,
  x: X,
} satisfies Record<ParsedSocialItem['type'], ComponentType>

const sizesForType = {
  bluesky: '17px',
  discord: '18px',
  farcaster: '18px',
  github: '17px',
  telegram: '17px',
  warpcast: '17px',
  x: '16px',
} satisfies Record<ParsedSocialItem['type'], string>

export function Socials() {
  const config = useConfig()

  if (!config.socials) return null
  if (config.socials.length === 0) return null
  return (
    <div className={styles.root}>
      {config.socials.map((social, i) => (
        <Fragment key={i}>
          {i !== 0 && (
            <div
              style={{
                width: '1px',
                marginTop: spaceVars[4],
                marginBottom: spaceVars[4],
                backgroundColor: primitiveColorVars.border,
              }}
            />
          )}
          <a className={styles.button} href={social.link} target="_blank" rel="noopener noreferrer">
            <Icon
              className={styles.icon}
              label={social.label}
              icon={iconsForIcon[social.icon]}
              size={sizesForType[social.icon] || '20px'}
            />
          </a>
        </Fragment>
      ))}
    </div>
  )
}
