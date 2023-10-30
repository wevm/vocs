import { style } from '@vanilla-extract/css'

import { primitiveColorVars, spaceVars, viewportVars } from '../styles/vars.css.js'

export const root = style({
  borderLeft: `1.5px solid ${primitiveColorVars.border}`,
  counterReset: 'step',
  paddingLeft: spaceVars['24'],
  marginLeft: spaceVars['12'],
  marginTop: spaceVars['24'],
  '@media': {
    [viewportVars['max-720px']]: {
      marginLeft: spaceVars['4'],
    },
  },
})
