import { createVar, style } from '@vanilla-extract/css'

import {
  contentVars,
  fontSizeVars,
  fontWeightVars,
  primitiveColorVars,
  spaceVars,
  viewportVars,
} from '../styles/vars.css.js'

const iconWidthVar = createVar('iconWidth')

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spaceVars['32'],
  maxWidth: contentVars.width,
  overflowX: 'hidden',
  padding: `${spaceVars['28']} ${contentVars.horizontalPadding} ${spaceVars['48']}`,
  vars: {
    [iconWidthVar]: '24px',
  },
})

export const container = style(
  {
    borderBottom: `1px solid ${primitiveColorVars.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: spaceVars['16'],
  },
  'container',
)

export const editLink = style(
  {
    alignItems: 'center',
    display: 'flex',
    fontSize: fontSizeVars['14'],
    gap: spaceVars['8'],
    textDecoration: 'none',
  },
  'editLink',
)

export const lastUpdated = style(
  {
    color: primitiveColorVars.text3,
    fontSize: fontSizeVars['14'],
  },
  'lastUpdated',
)

export const navigation = style(
  {
    display: 'flex',
    justifyContent: 'space-between',
  },
  'navigation',
)

export const navigationIcon = style(
  {
    width: iconWidthVar,
  },
  'navigationIcon',
)

export const navigationIcon_left = style(
  {
    display: 'flex',
    '@media': {
      [viewportVars['max-720px']]: {
        justifyContent: 'center',
      },
    },
  },
  'navigationIcon_left',
)

export const navigationIcon_right = style(
  {
    display: 'flex',
    justifyContent: 'flex-end',
    '@media': {
      [viewportVars['max-720px']]: {
        justifyContent: 'center',
      },
    },
  },
  'navigationIcon_right',
)

export const navigationItem = style(
  {
    display: 'flex',
    flexDirection: 'column',
    gap: spaceVars['4'],
  },
  'navigationItem',
)

export const navigationItem_left = style({}, 'navigationItem_left')

export const navigationItem_right = style(
  {
    alignItems: 'flex-end',
  },
  'navigationItem_right',
)

export const navigationText = style(
  {
    alignItems: 'center',
    display: 'flex',
    fontSize: fontSizeVars['18'],
    fontWeight: fontWeightVars.medium,
    '@media': {
      [viewportVars['max-720px']]: {
        fontSize: fontSizeVars['12'],
      },
    },
  },
  'navigationText',
)

export const navigationTextInner = style(
  {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '26ch',
    whiteSpace: 'pre',
    '@media': {
      [viewportVars['max-480px']]: {
        width: '20ch',
      },
    },
  },
  'navigationTextInner',
)
