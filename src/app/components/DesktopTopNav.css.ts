import { style } from '@vanilla-extract/css'
import { primitiveColorVars, topNavVars, viewportVars } from '../styles/vars.css.js'

export const root = style({
  backgroundColor: `color-mix(in srgb, ${primitiveColorVars.background} 98%, transparent)`,
  height: topNavVars.height,
  '@media': {
    [viewportVars['max-1080px']]: {
      display: 'none',
    },
  },
})

export const curtain = style(
  {
    background: `linear-gradient(${primitiveColorVars.background}, transparent 70%)`,
    height: '30px',
    opacity: 0.98,
    width: '100%',
    '@media': {
      [viewportVars['max-1080px']]: {
        display: 'none',
      },
    },
  },
  'curtain',
)
