import { type ComponentType, Fragment } from 'react'
import type { ParsedSocialItem } from '../../config.js'
import { useConfig } from '../hooks/useConfig.js'
import { primitiveColorVars, spaceVars } from '../styles/vars.css.js'
import { Icon } from './Icon.js'
import * as styles from './Socials.css.js'
import { Discord } from './icons/Discord.js'
import { GitHub } from './icons/GitHub.js'
import { Telegram } from './icons/Telegram.js'
import { Warpcast } from './icons/Warpcast.js'
import { X } from './icons/X.js'

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
          <SocialButton {...social} />
        </Fragment>
      ))}
    </div>
  )
}

const iconsForIcon = {
  discord: Discord,
  github: GitHub,
  telegram: Telegram,
  warpcast: Warpcast,
  x: X,
} satisfies Record<ParsedSocialItem['type'], ComponentType>

const sizesForType = {
  discord: '18px',
  github: '17px',
  telegram: '17px',
  warpcast: '17px',
  x: '16px',
} satisfies Record<ParsedSocialItem['type'], string>

function SocialButton({ icon, label, link }: ParsedSocialItem) {
  return (
    <a className={styles.socialButton} href={link} target="_blank" rel="noopener noreferrer">
      <Icon
        className={styles.icon}
        label={label}
        icon={iconsForIcon[icon]}
        size={sizesForType[icon] || '20px'}
      />
    </a>
  )
}
