import { style } from '@vanilla-extract/css'
import {
  borderRadiusVars,
  fontSizeVars,
  fontWeightVars,
  primitiveColorVars,
  semanticColorVars,
  spaceVars,
} from '../styles/vars.css.js'

export const root = style({
  background: primitiveColorVars.background,
  borderRadius: borderRadiusVars['4'],
  color: semanticColorVars.link,
  fontSize: fontSizeVars['14'],
  fontWeight: fontWeightVars.semibold,
  left: spaceVars[8],
  padding: `${spaceVars['8']} ${spaceVars['16']}`,
  position: 'fixed',
  textDecoration: 'none',
  top: spaceVars[8],
  zIndex: 999,
  ':focus': {
    clip: 'auto',
    clipPath: 'none',
    height: 'auto',
    width: 'auto',
  },
})
