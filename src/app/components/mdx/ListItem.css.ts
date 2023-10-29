import { style } from '@vanilla-extract/css'
import { lineHeightVars } from '../../styles/vars.css.js'

export const root = style({
  lineHeight: lineHeightVars.listItem,
})
