import { config } from 'virtual:config'

import type { SocialItem } from '../../config.js'
import { useTheme } from '../hooks/useTheme.js'
import * as styles from './DesktopTopNav.css.js'
import { Icon } from './Icon.js'

DesktopTopNav.Curtain = Curtain

export function DesktopTopNav() {
  return (
    <div className={styles.root}>
      <div className={styles.section} />
      <div className={styles.section}>
        <div className={styles.group}>
          {config.socials?.map((social, i) => (
            <div className={styles.item} key={i}>
              <SocialButton {...social} />
            </div>
          ))}
        </div>
        <div className={styles.divider} />
        <div className={styles.group}>
          <div className={styles.item}>
            <ThemeToggleButton />
          </div>
        </div>
      </div>
    </div>
  )
}

export function Curtain() {
  return <div className={styles.curtain} />
}

function ThemeToggleButton() {
  const { toggle, theme } = useTheme()
  return (
    <button className={styles.button} onClick={toggle} type="button">
      {theme === 'dark' ? (
        <Icon className={styles.icon} size="20px" label="Light" src="/.vocs/icons/sun.svg" />
      ) : (
        <Icon
          className={styles.icon}
          size="20px"
          label="Dark"
          src="/.vocs/icons/moon.svg"
          style={{ marginTop: '-2px' }}
        />
      )}
    </button>
  )
}

const sizesForIcons = {
  discord: '23px',
  github: '20px',
  x: '18px',
} satisfies Record<SocialItem['icon'], string>

function SocialButton({ icon, link }: SocialItem) {
  return (
    <a className={styles.button} href={link} target="_blank" rel="noopener noreferrer">
      <Icon
        className={styles.icon}
        label={`${icon} Icon`}
        size={sizesForIcons[icon] || '20px'}
        src={`/.vocs/icons/${icon}.svg`}
      />
    </a>
  )
}
