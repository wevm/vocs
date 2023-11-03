import { style } from '@vanilla-extract/css'
import { fontSizeVars } from '../styles/vars.css.js'

export const root = style({
  fontSize: fontSizeVars['12'],
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
})
