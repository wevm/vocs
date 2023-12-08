import { createVar, style } from '@vanilla-extract/css'

import { contentVars, fontSizeVars, fontWeightVars, spaceVars } from '../styles/vars.css.js'

const iconWidthVar = createVar('iconWidth')

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spaceVars['32'],
  maxWidth: contentVars.width,
  overflowX: 'hidden',
  padding: `${spaceVars['24']} ${contentVars.horizontalPadding} ${spaceVars['48']}`,
  width: contentVars.width,
  vars: {
    [iconWidthVar]: '24px',
  },
})

export const editLink = style(
  {
    fontSize: fontSizeVars['14'],
    textDecoration: 'none',
  },
  'editLink',
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

export const navigationIcon_left = style({}, 'navigationIcon_left')

export const navigationIcon_right = style(
  {
    display: 'flex',
    justifyContent: 'flex-end',
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
  },
  'navigationText',
)
