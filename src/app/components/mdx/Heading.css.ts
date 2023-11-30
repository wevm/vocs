import { style } from '@vanilla-extract/css'
import {
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
  spaceVars,
  topNavVars,
  viewportVars,
} from '../../styles/vars.css.js'

import { title as Step_title } from '../Step.css.js'
import { root as Header } from './Header.css.js'

export const root = style({
  alignItems: 'center',
  color: primitiveColorVars.heading,
  fontWeight: fontWeightVars.semibold,
  gap: '0.25em',
  lineHeight: lineHeightVars.heading,
  position: 'relative',
})

export const slugTarget = style(
  {
    position: 'absolute',
    top: '0px',
    visibility: 'hidden',
    '@media': {
      [viewportVars['min-1080px']]: {
        top: `calc(-1 * (${topNavVars.height}))`,
        selectors: {
          [`${Header} &, ${Step_title} &, ${Header} + ${root} &`]: {
            top: `calc(-1 * (${topNavVars.height} + ${spaceVars['24']}))`,
          },
        },
      },
      [viewportVars['max-1080px']]: {
        top: `calc(-1 * ${topNavVars.curtainHeight})`,
        selectors: {
          [`${Header} &, ${Header} + ${root} &`]: {
            top: `calc(-1 * calc(${topNavVars.curtainHeight} + ${spaceVars['24']}))`,
          },
        },
      },
    },
  },
  'slugTarget',
)
