import { style } from '@vanilla-extract/css'
import { fontWeightVars, lineHeightVars, topNavVars, viewportVars } from '../../styles/vars.css.js'

export const root = style({
  alignItems: 'center',
  display: 'flex',
  fontWeight: fontWeightVars.semibold,
  gap: '0.25em',
  lineHeight: lineHeightVars.heading,
  position: 'relative',
})

export const slugTarget = style(
  {
    position: 'absolute',
    top: '0px',
    visibility: 'hidden',
    '@media': {
      [viewportVars['max-1080px']]: {
        top: `calc(-1 * ${topNavVars.lowerHeight})`,
      },
    },
  },
  'slugTarget',
)
