import { style } from '@vanilla-extract/css'
import {
  contentVars,
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
  spaceVars,
} from '../styles/vars.css.js'

export const breadcrumb = style(
  {
    fontSize: fontSizeVars['14'],
    fontWeight: fontWeightVars.medium,
  },
  'breadcrumb',
)

export const upper = style(
  {
    alignItems: 'center',
    backgroundColor: primitiveColorVars.backgroundDark,
    borderBottom: `1px solid ${primitiveColorVars.border}`,
    display: 'flex',
    height: '100%',
    padding: `${spaceVars['0']} ${contentVars.horizontalPadding}`,
    width: '100%',
  },
  'upper',
)

export const lower = style(
  {
    alignItems: 'center',
    backgroundColor: primitiveColorVars.backgroundDark,
    borderBottom: `1px solid ${primitiveColorVars.border}`,
    display: 'flex',
    height: '100%',
    padding: `${spaceVars['0']} ${contentVars.horizontalPadding}`,
    width: '100%',
  },
  'lower',
)

export const lowerLeft = style(
  {
    alignItems: 'center',
    display: 'flex',
    gap: spaceVars['4'],
  },
  'lowerLeft',
)

export const menuTrigger = style(
  {
    alignItems: 'center',
    display: 'flex',
    gap: spaceVars['12'],
  },
  'menuTrigger',
)

export const title = style(
  {
    fontSize: fontSizeVars['18'],
    fontWeight: fontWeightVars.semibold,
    lineHeight: lineHeightVars.heading,
  },
  'title',
)
