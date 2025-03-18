import { style } from '@vanilla-extract/css'
import { contentVars, primitiveColorVars } from '../styles/vars.css.js'

export const root = style({
  backgroundColor: primitiveColorVars.background,
  flex: 1,
  maxWidth: contentVars.width,
  padding: `${contentVars.verticalPadding} ${contentVars.horizontalPadding}`,
  position: 'relative',
  width: '100%',
})
