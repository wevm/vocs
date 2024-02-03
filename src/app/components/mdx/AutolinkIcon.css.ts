import { createVar, style } from '@vanilla-extract/css'

import { primitiveColorVars } from '../../styles/vars.css.js'
import { root as Autolink } from './Autolink.css.js'

export const mask = createVar('mask')

export const root = style({
  backgroundColor: primitiveColorVars.textAccent,
  display: 'inline-block',
  marginLeft: '0.25em',
  height: '0.8em',
  width: '0.8em',
  mask,
  transition: 'background-color 0.1s',
  selectors: {
    [`${Autolink}:hover &`]: {
      backgroundColor: primitiveColorVars.textAccentHover,
    },
  },
})
