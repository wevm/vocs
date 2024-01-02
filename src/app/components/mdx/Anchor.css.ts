import { globalStyle, style } from '@vanilla-extract/css'

import { fontWeightVars, semanticColorVars, spaceVars } from '../../styles/vars.css.js'
import { danger, info, success, tip, warning } from '../Callout.css.js'
import { root as Section } from './Section.css.js'

export const root = style({
  color: semanticColorVars.link,
  fontWeight: fontWeightVars.medium,
  textUnderlineOffset: spaceVars['2'],
  textDecoration: 'underline',
  transition: 'color 0.1s',
  selectors: {
    [`${danger} &`]: {
      color: semanticColorVars.dangerText,
    },
    [`${danger} &:hover`]: {
      color: semanticColorVars.dangerTextHover,
    },
    [`${info} &`]: {
      color: semanticColorVars.infoText,
    },
    [`${info} &:hover`]: {
      color: semanticColorVars.infoTextHover,
    },
    [`${success} &`]: {
      color: semanticColorVars.successText,
    },
    [`${success} &:hover`]: {
      color: semanticColorVars.successTextHover,
    },
    [`${tip} &`]: {
      color: semanticColorVars.tipText,
    },
    [`${tip} &:hover`]: {
      color: semanticColorVars.tipTextHover,
    },
    [`${warning} &`]: {
      color: semanticColorVars.warningText,
    },
    [`${warning} &:hover`]: {
      color: semanticColorVars.warningTextHover,
    },
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
