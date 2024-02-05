import { globalStyle, style } from '@vanilla-extract/css'
import {
  borderRadiusVars,
  fontSizeVars,
  fontWeightVars,
  primitiveColorVars,
  semanticColorVars,
  spaceVars,
  viewportVars,
} from '../styles/vars.css.js'

export const root = style({
  backgroundColor: semanticColorVars.codeBlockBackground,
  border: `1px solid ${semanticColorVars.codeInlineBorder}`,
  borderRadius: borderRadiusVars['4'],
})

export const list = style(
  {
    backgroundColor: semanticColorVars.codeTitleBackground,
    borderBottom: `1px solid ${primitiveColorVars.border}`,
    borderTopLeftRadius: borderRadiusVars['4'],
    borderTopRightRadius: borderRadiusVars['4'],
    display: 'flex',
    padding: `${spaceVars['0']} ${spaceVars['14']}`,
    '@media': {
      [viewportVars['max-720px']]: {
        borderRadius: 0,
        padding: `${spaceVars['0']} ${spaceVars['8']}`,
      },
    },
  },
  'list',
)

export const trigger = style(
  {
    borderBottom: '2px solid transparent',
    color: primitiveColorVars.text3,
    fontSize: fontSizeVars['14'],
    fontWeight: fontWeightVars.medium,
    padding: `${spaceVars['8']} ${spaceVars['8']} ${spaceVars['6']} ${spaceVars['8']}`,
    transition: 'color 0.1s',
    selectors: {
      '&:hover': {
        color: primitiveColorVars.text,
      },
      '&[data-state="active"]': {
        borderBottom: `2px solid ${primitiveColorVars.borderAccent}`,
        color: primitiveColorVars.text,
      },
    },
  },
  'trigger',
)

export const content = style(
  {
    backgroundColor: semanticColorVars.codeBlockBackground,
    selectors: {
      '&:not([data-shiki="true"])': {
        padding: `${spaceVars['20']} ${spaceVars['22']}`,
        '@media': {
          [viewportVars['max-720px']]: {
            padding: `${spaceVars['20']} ${spaceVars['16']}`,
          },
        },
      },
    },
  },
  'content',
)

globalStyle(`${root} pre`, {
  marginBottom: spaceVars['0'],
  '@media': {
    [viewportVars['max-720px']]: {
      margin: 'unset',
    },
  },
})
