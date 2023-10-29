import { style } from '@vanilla-extract/css'
import { primitiveColorVars, semanticColorVars } from '../../styles/vars.css.js'

export const root = style({
  borderTop: `1px solid ${semanticColorVars.tableBorder}`,
  selectors: {
    '&:nth-child(2n)': {
      backgroundColor: primitiveColorVars.background2,
    },
  },
})
