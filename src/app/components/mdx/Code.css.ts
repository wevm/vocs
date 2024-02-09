import { style } from '@vanilla-extract/css'

import {
  borderRadiusVars,
  fontSizeVars,
  semanticColorVars,
  spaceVars,
} from '../../styles/vars.css.js'
import { danger, info, success, tip, warning } from '../Callout.css.js'
import { root as Anchor } from './Anchor.css.js'
import { root as Heading } from './Heading.css.js'
import { root as Pre } from './Pre.css.js'

export const root = style({
  transition: 'color 0.1s',
  selectors: {
    [`:not(${Pre})>&`]: {
      backgroundColor: semanticColorVars.codeInlineBackground,
      border: `1px solid ${semanticColorVars.codeInlineBorder}`,
      borderRadius: borderRadiusVars['4'],
      color: semanticColorVars.codeInlineText,
      fontSize: fontSizeVars.code,
      padding: `${spaceVars['3']} ${spaceVars['6']}`,
    },
    [`${Anchor}>&`]: {
      color: semanticColorVars.link,
      textDecoration: 'underline',
      textUnderlineOffset: spaceVars['2'],
    },
    [`${Anchor}:hover>&`]: {
      color: semanticColorVars.linkHover,
    },
    [`${danger} &`]: {
      color: semanticColorVars.dangerText,
    },
    [`${info} &`]: {
      color: semanticColorVars.infoText,
    },
    [`${success} &`]: {
      color: semanticColorVars.successText,
    },
    [`${tip} &`]: {
      color: semanticColorVars.tipText,
    },
    [`${warning} &`]: {
      color: semanticColorVars.warningText,
    },
    [`${Heading} &`]: {
      color: 'inherit',
    },
    '.twoslash-popup-info-hover>&': {
      backgroundColor: 'inherit',
      padding: 0,
      // @ts-expect-error
      textWrap: 'wrap',
    },
    '.twoslash-popup-jsdoc &': {
      display: 'inline',
    },
  },
})
