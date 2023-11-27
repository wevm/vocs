import { style } from '@vanilla-extract/css'
import { fontSizeVars, fontWeightVars, lineHeightVars } from '../styles/vars.css.js'

export const logoImage = style(
  {
    height: '30%',
    width: 'auto',
  },
  'logoImage',
)

export const title = style(
  {
    fontSize: fontSizeVars['18'],
    fontWeight: fontWeightVars.semibold,
    lineHeight: lineHeightVars.heading,
  },
  'title',
)
