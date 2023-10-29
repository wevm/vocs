import { style } from '@vanilla-extract/css'
import { fontSizeVars, fontWeightVars, lineHeightVars, spaceVars } from '../../styles/vars.css.js'
import { root as H3 } from './H3.css.js'

export const root = style({
  fontSize: fontSizeVars.h4,
  fontWeight: fontWeightVars.semibold,
  lineHeight: lineHeightVars.heading,
  selectors: {
    '&:not(:first-child)': {
      marginTop: spaceVars['18'],
      paddingTop: spaceVars['18'],
    },
    '&:not(:last-child)': {
      marginBottom: spaceVars['18'],
    },
    [`${H3}+&`]: {
      paddingTop: spaceVars['0'],
    },
  },
})
