import { style } from '@vanilla-extract/css'
import { semanticColorVars, spaceVars } from '../../styles/vars.css.js'

export const root = style({
  borderTop: `1px solid ${semanticColorVars.hr}`,
  marginBottom: spaceVars['16'],
})
