import { style } from '@vanilla-extract/css'
import { fontSizeVars, primitiveColorVars, spaceVars } from '../../styles/vars.css.js'
import { root as header } from './Header.css.js'

export const root = style({
  fontSize: fontSizeVars.h2,
  letterSpacing: '-0.02em',
  selectors: {
    '&&:not(:last-child)': {
      marginBottom: spaceVars['24'],
    },
    [`:not(${header}) + &:not(:only-child)`]: {
      borderTop: `1px solid ${primitiveColorVars.border}`,
      marginTop: spaceVars['56'],
      paddingTop: spaceVars['24'],
    },
    '[data-layout="landing"] &&': {
      borderTop: 'none',
      marginTop: spaceVars['24'],
      paddingTop: 0,
    },
  },
})
