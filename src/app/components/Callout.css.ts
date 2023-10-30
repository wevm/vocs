import { style } from '@vanilla-extract/css'

import {
  borderRadiusVars,
  fontSizeVars,
  semanticColorVars,
  spaceVars,
  viewportVars,
} from '../styles/vars.css.js'
import { content as stepContent } from './Step.css.js'

export const root = style({
  borderRadius: borderRadiusVars['4'],
  fontSize: fontSizeVars['14'],
  padding: `${spaceVars['16']} ${spaceVars['20']}`,
  marginBottom: spaceVars['16'],
  selectors: {
    [`:not(${stepContent}) > &`]: {
      '@media': {
        [viewportVars['max-720px']]: {
          borderRadius: 0,
          borderLeftWidth: 0,
          borderRightWidth: 0,
          marginLeft: `calc(-1 * ${spaceVars['16']})`,
          marginRight: `calc(-1 * ${spaceVars['16']})`,
        },
      },
    },
  },
})

export const note = style(
  {
    backgroundColor: semanticColorVars.noteBackground,
    border: `1px solid ${semanticColorVars.noteBorder}`,
    color: semanticColorVars.noteText,
  },
  'note',
)

export const info = style(
  {
    backgroundColor: semanticColorVars.infoBackground,
    border: `1px solid ${semanticColorVars.infoBorder}`,
    color: semanticColorVars.infoText,
  },
  'info',
)

export const warning = style(
  {
    backgroundColor: semanticColorVars.warningBackground,
    border: `1px solid ${semanticColorVars.warningBorder}`,
    color: semanticColorVars.warningText,
  },
  'warning',
)

export const danger = style(
  {
    backgroundColor: semanticColorVars.dangerBackground,
    border: `1px solid ${semanticColorVars.dangerBorder}`,
    color: semanticColorVars.dangerText,
  },
  'danger',
)

export const tip = style(
  {
    backgroundColor: semanticColorVars.tipBackground,
    border: `1px solid ${semanticColorVars.tipBorder}`,
    color: semanticColorVars.tipText,
  },
  'tip',
)

export const success = style(
  {
    backgroundColor: semanticColorVars.successBackground,
    border: `1px solid ${semanticColorVars.successBorder}`,
    color: semanticColorVars.successText,
  },
  'success',
)
