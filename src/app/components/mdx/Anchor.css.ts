import { globalStyle, style } from '@vanilla-extract/css'

import { fontWeightVars, semanticColorVars, spaceVars } from '../../styles/vars.css.js'
import { root as Section } from './Section.css.js'

export const root = style({
  color: semanticColorVars.link,
  fontWeight: fontWeightVars.medium,
  textUnderlineOffset: spaceVars['2'],
  textDecoration: 'underline',
  selectors: {
    '&:hover': {
      color: semanticColorVars.linkHover,
    },
  },
})

globalStyle(`${Section} a.data-footnote-backref`, {
  color: semanticColorVars.link,
  fontWeight: fontWeightVars.medium,
  textUnderlineOffset: spaceVars['2'],
  textDecoration: 'underline',
})

globalStyle(`${Section} a.data-footnote-backref:hover`, {
  color: semanticColorVars.linkHover,
})
