import { style } from '@vanilla-extract/css'
import {
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
  spaceVars,
} from '../../styles/vars.css.js'

export const root = style({
  color: primitiveColorVars.text2,
  fontSize: fontSizeVars.subtitle,
  fontWeight: fontWeightVars.regular,
  lineHeight: lineHeightVars.heading,
  marginTop: spaceVars['4'],
  textWrap: 'balance',
})
