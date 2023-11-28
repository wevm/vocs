import { style } from '@vanilla-extract/css'

import { primitiveColorVars, spaceVars } from '../styles/vars.css.js'

export const searchButton = style(
  {
    alignItems: 'center',
    display: 'flex',
    color: primitiveColorVars.text,
    height: spaceVars[28],
    justifyContent: 'center',
    width: spaceVars[28],
  },
  'searchButton',
)
