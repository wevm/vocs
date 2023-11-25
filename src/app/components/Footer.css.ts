import { style } from '@vanilla-extract/css'

import {
  contentVars,
  fontSizeVars,
  fontWeightVars,
  semanticColorVars,
  spaceVars,
} from '../styles/vars.css.js'

export const root = style({
  maxWidth: contentVars.width,
  marginTop: spaceVars['28'],
  overflowX: 'hidden',
  padding: `${contentVars.verticalPadding} ${contentVars.horizontalPadding}`,
  width: contentVars.width,
})

export const editLink = style(
  {
    color: semanticColorVars.link,
    fontSize: fontSizeVars['14'],
    fontWeight: fontWeightVars.medium,
  },
  'editLink',
)
