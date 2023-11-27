import { style } from '@vanilla-extract/css'

import { spaceVars, viewportVars } from '../../styles/vars.css.js'

export const root = style({
  '@media': {
    [viewportVars['max-720px']]: {
      borderRadius: 0,
      borderRight: 'none',
      borderLeft: 'none',
      marginLeft: `calc(-1 * ${spaceVars['16']})`,
      marginRight: `calc(-1 * ${spaceVars['16']})`,
    },
  },
})
