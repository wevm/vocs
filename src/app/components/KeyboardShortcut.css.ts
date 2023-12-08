import { style } from '@vanilla-extract/css'

import { fontSizeVars, spaceVars } from '../styles/vars.css.js'

export const root = style({
  alignItems: 'center',
  display: 'inline-flex',
  gap: spaceVars[6],
  fontSize: fontSizeVars[12],
})

export const kbdGroup = style(
  {
    alignItems: 'center',
    display: 'inline-flex',
    gap: spaceVars[3],
  },
  'kbdGroup',
)
