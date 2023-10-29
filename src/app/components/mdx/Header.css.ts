import { style } from '@vanilla-extract/css'
import { primitiveColorVars, spaceVars } from '../../styles/vars.css.js'

export const root = style({
  borderBottom: `1px solid ${primitiveColorVars.border}`,
  selectors: {
    '&:not(:last-child)': {
      marginBottom: spaceVars['28'],
      paddingBottom: spaceVars['28'],
    },
  },
})
