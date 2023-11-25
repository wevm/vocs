import { style } from '@vanilla-extract/css'
import { borderRadiusVars, primitiveColorVars, spaceVars, zIndexVars } from '../styles/vars.css.js'

export const root = style({
  backgroundColor: primitiveColorVars.background2,
  border: `1px solid ${primitiveColorVars.border}`,
  borderRadius: borderRadiusVars[4],
  margin: `0 ${spaceVars[6]}`,
  zIndex: zIndexVars.popover,
})
