import { style } from '@vanilla-extract/css'

import { fontSizeVars, spaceVars, viewportVars } from '../styles/vars.css.js'

export const root = style({
  alignItems: 'center',
  display: 'inline-flex',
  gap: spaceVars[6],
  fontSize: fontSizeVars[12],
  '@media': {
    [viewportVars['max-720px']]: {
      display: 'none',
    },
  },
})

export const kbdGroup = style(
  {
    alignItems: 'center',
    display: 'inline-flex',
    gap: spaceVars[3],
  },
  'kbdGroup',
)
