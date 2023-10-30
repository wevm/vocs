import { style } from '@vanilla-extract/css'
import {
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
  sidebarVars,
  spaceVars,
  topNavVars,
} from '../styles/vars.css.js'

export const root = style({
  backgroundColor: primitiveColorVars.backgroundDark,
  display: 'flex',
  flexDirection: 'column',
  gap: spaceVars['16'],
  height: '100vh',
  padding: `${spaceVars['0']} ${sidebarVars.horizontalPadding}`,
  width: sidebarVars.width,
})

export const item = style(
  {
    color: primitiveColorVars.text3,
    fontSize: fontSizeVars['14'],
    fontWeight: fontWeightVars.medium,
    lineHeight: lineHeightVars.sidebarItem,
    letterSpacing: '0.25px',
    selectors: {
      '&:hover': {
        color: primitiveColorVars.text,
      },
      '&[data-active="true"]': {
        color: primitiveColorVars.textAccent,
      },
    },
  },
  'item',
)

export const items = style(
  {
    display: 'flex',
    flexDirection: 'column',
  },
  'items',
)

export const section = style(
  {
    display: 'flex',
    flexDirection: 'column',
    gap: spaceVars['4'],
  },
  'section',
)

export const sectionTitle = style(
  {
    fontSize: fontSizeVars['14'],
    fontWeight: fontWeightVars.semibold,
    letterSpacing: '0.25px',
  },
  'sectionTitle',
)

export const title = style(
  {
    alignItems: 'center',
    borderBottom: `1px solid ${primitiveColorVars.border}`,
    display: 'flex',
    height: topNavVars.upperHeight,
    fontSize: fontSizeVars['18'],
    fontWeight: fontWeightVars.semibold,
    lineHeight: lineHeightVars.heading,
  },
  'title',
)
