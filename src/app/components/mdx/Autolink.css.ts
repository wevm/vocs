import { style } from '@vanilla-extract/css'

import { root as Heading } from './Heading.css.js'

export const root = style({
  opacity: 0,
  marginTop: '0.1em',
  position: 'absolute',
  transition: 'opacity 0.1s, transform 0.1s,',
  transform: 'translateX(-2px) scale(0.98)',
  selectors: {
    [`${Heading}:hover &`]: {
      opacity: 1,
      transform: 'translateX(0) scale(1)',
    },
  },
})
