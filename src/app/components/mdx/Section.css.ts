import { style } from '@vanilla-extract/css'
import { primitiveColorVars, spaceVars } from '../../styles/vars.css.js'

export const root = style({
  borderTop: `1px solid ${primitiveColorVars.border}`,
  marginTop: spaceVars['56'],
  paddingTop: spaceVars['24'],
})
