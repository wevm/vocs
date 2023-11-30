import { style } from '@vanilla-extract/css'

import { fontWeightVars, spaceVars } from '../../styles/vars.css.js'
import { root as Callout } from '../Callout.css.js'
import { root as Details } from './Details.css.js'

export const root = style({
  cursor: 'pointer',
  selectors: {
    '&&:hover': {
      textDecoration: 'underline',
    },
    [`${Details}[open] &`]: {
      marginBottom: spaceVars['4'],
    },
    [`${Callout} &`]: {
      fontWeight: fontWeightVars.medium,
    },
    [`${Details} &&`]: {
      marginBottom: 0,
    },
  },
})
