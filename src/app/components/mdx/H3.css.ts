import { style } from '@vanilla-extract/css'
import { fontSizeVars, spaceVars } from '../../styles/vars.css.js'
import { root as H2 } from './H2.css.js'

export const root = style({
  fontSize: fontSizeVars.h3,
  selectors: {
    '&:not(:first-child)': {
      marginTop: spaceVars['18'],
      paddingTop: spaceVars['18'],
    },
    '&&:not(:last-child)': {
      marginBottom: spaceVars['24'],
    },
    [`${H2}+&`]: {
      paddingTop: spaceVars['0'],
    },
  },
})
