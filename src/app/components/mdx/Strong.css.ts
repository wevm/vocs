import { style } from '@vanilla-extract/css'

import { fontWeightVars, spaceVars } from '../../styles/vars.css.js'
import { root as Callout } from '../Callout.css.js'
import { root as Content } from '../Content.css.js'

export const root = style({
  fontWeight: fontWeightVars.semibold,
  selectors: {
    [`${Content} > &`]: {
      display: 'block',
    },
    [`${Callout} > &`]: {
      display: 'block',
      marginBottom: spaceVars['4'],
    },
  },
})
