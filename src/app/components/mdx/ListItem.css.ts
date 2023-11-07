import { style } from '@vanilla-extract/css'
import { lineHeightVars } from '../../styles/vars.css.js'

export const root = style({
  lineHeight: lineHeightVars.listItem,
  selectors: {
    '&:not(:last-child)': {
      marginBottom: '0.5em',
    },
  },
})
