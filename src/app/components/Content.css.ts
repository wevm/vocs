import { style } from '@vanilla-extract/css'
import { contentVars, primitiveColorVars } from '../styles/vars.css.js'

export const root = style({
  backgroundColor: primitiveColorVars.background,
  maxWidth: contentVars.width,
  padding: `${contentVars.verticalPadding} ${contentVars.horizontalPadding}`,
  width: '100%',
})
