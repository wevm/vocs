import { style, globalStyle } from '@vanilla-extract/css'

import { fontWeightVars, primitiveColorVars } from '../styles/vars.css.js'

export const root = style({
  vars: {
    '--pagefind-ui-background': primitiveColorVars.backgroundDark,
    '--pagefind-ui-border': primitiveColorVars.border,
    '--pagefind-ui-border-width': '1px',
    '--pagefind-ui-text': primitiveColorVars.text,
  },
})

globalStyle(`${root} .pagefind-ui__search-input`, {
  fontWeight: fontWeightVars.regular,
})
