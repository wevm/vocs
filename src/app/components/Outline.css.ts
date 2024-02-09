import { style } from '@vanilla-extract/css'

import { gutterRight as DocsLayout_gutterRight } from '../layouts/DocsLayout.css.js'

import {
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
  spaceVars,
} from '../styles/vars.css.js'

export const root = style({
  width: '100%',
})

export const nav = style(
  {
    display: 'flex',
    flexDirection: 'column',
    gap: spaceVars[8],
    selectors: {
      [`${DocsLayout_gutterRight} &`]: {
        borderLeft: `1px solid ${primitiveColorVars.border}`,
        paddingLeft: spaceVars[16],
      },
    },
  },
  'nav',
)

export const heading = style(
  {
    color: primitiveColorVars.title,
    fontSize: fontSizeVars[13],
    fontWeight: fontWeightVars.semibold,
    lineHeight: lineHeightVars.heading,
    letterSpacing: '0.025em',
  },
  'heading',
)

export const items = style(
  {
    selectors: {
      '& &': {
        paddingLeft: spaceVars[12],
      },
    },
  },
  'items',
)

export const item = style(
  {
    lineHeight: lineHeightVars.outlineItem,
    marginBottom: spaceVars[8],
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    // @ts-expect-error
    textWrap: 'nowrap',
  },
  'item',
)

export const link = style(
  {
    color: primitiveColorVars.text2,
    fontWeight: fontWeightVars.medium,
    fontSize: fontSizeVars[13],
    transition: 'color 0.1s',
    selectors: {
      '&[data-active="true"]': {
        color: primitiveColorVars.textAccent,
      },
      '&[data-active="true"]:hover': {
        color: primitiveColorVars.textAccentHover,
      },
      '&:hover': {
        color: primitiveColorVars.text,
      },
    },
  },
  'link',
)
