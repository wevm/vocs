import { style } from '@vanilla-extract/css'

import { root as Callout } from '../Callout.css.js'

export const root = style({
  selectors: {
    [`${Callout} > * + &`]: {
      marginTop: '-8px',
    },
  },
})
