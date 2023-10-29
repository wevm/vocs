import { style } from '@vanilla-extract/css'

import { fontSizeVars, fontWeightVars, lineHeightVars } from '../../styles/vars.css.js'

export const root = style({
  fontSize: fontSizeVars.h1,
  fontWeight: fontWeightVars.semibold,
  letterSpacing: '-0.02em',
  lineHeight: lineHeightVars.heading,
})
