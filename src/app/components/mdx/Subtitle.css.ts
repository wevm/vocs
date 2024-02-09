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
  letterSpacing: '-0.02em',
  lineHeight: lineHeightVars.heading,
  marginTop: spaceVars['4'],
  // @ts-expect-error
  textWrap: 'balance',
})
