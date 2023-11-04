import { style } from '@vanilla-extract/css'

import { root as Heading } from './Heading.css.js'

export const root = style({
  opacity: 0,
  marginTop: '0.1em',
  display: 'inherit',
  selectors: {
    [`${Heading}:hover &`]: {
      opacity: 1,
    },
  },
})
