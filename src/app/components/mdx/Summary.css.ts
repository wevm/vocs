import { style } from '@vanilla-extract/css'

import { fontWeightVars, primitiveColorVars } from '../../styles/vars.css.js'
import { root as Callout } from '../Callout.css.js'
import { root as Details } from './Details.css.js'

export const root = style({
  cursor: 'pointer',
  selectors: {
    '&&:hover': {
      color: primitiveColorVars.text,
    },
    [`:not(${Callout}) > details > &`]: {
      color: primitiveColorVars.text3,
    },
    [`${Details}[open] &`]: {
      color: primitiveColorVars.text,
    },
    [`${Callout} &`]: {
      fontWeight: fontWeightVars.medium,
    },
  },
})
