import { style } from '@vanilla-extract/css'

import { fontWeightVars, lineHeightVars, spaceVars } from '../../styles/vars.css.js'
import { content as Callout } from '../Callout.css.js'
import { root as Details } from './Details.css.js'

export const root = style({
  cursor: 'pointer',
  lineHeight: lineHeightVars.paragraph,
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
