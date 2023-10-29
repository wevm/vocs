import { style } from '@vanilla-extract/css'

import { semanticColorVars, spaceVars } from '../../styles/vars.css.js'

export const root = style({
  borderLeft: `2px solid ${semanticColorVars.blockquoteBorder}`,
  paddingLeft: spaceVars['16'],
  marginBottom: spaceVars['16'],
})
