import { style } from '@vanilla-extract/css'

import { fontWeightVars, lineHeightVars, spaceVars } from '../../styles/vars.css.js'
import { content as Callout } from '../Callout.css.js'
import { root as Content } from '../Content.css.js'

export const root = style({
  fontWeight: fontWeightVars.semibold,
  lineHeight: lineHeightVars.paragraph,
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
