import { style } from '@vanilla-extract/css'
import {
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
  semanticColorVars,
  sidebarVars,
  spaceVars,
  topNavVars,
  zIndexVars,
} from '../styles/vars.css.js'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spaceVars['12'],
  overflow: 'scroll',
  width: sidebarVars.width,
  '@media': {
    'screen and (max-width: 1080px)': {
      width: '100%',
    },
  },
})

export const divider = style(
  {
    backgroundColor: primitiveColorVars.border,
    width: '100%',
    height: '1px',
  },
  'divider',
)

export const navigation = style(
  {
    outline: 0,
    selectors: {
      '&:first-child': {
        paddingTop: spaceVars['16'],
      },
    },
  },
  'navigation',
)

export const items = style(
  {
    display: 'flex',
    flexDirection: 'column',
  },
  'items',
)

export const group = style(
  {
    display: 'flex',
    flexDirection: 'column',
    gap: spaceVars['4'],
    get selectors() {
      return {
        [`${group} + ${group}`]: {
          borderTop: `1px solid ${primitiveColorVars.border}`,
          paddingTop: spaceVars['12'],
        },
      }
    },
  },
  'group',
)

export const item = style(
  {
    color: primitiveColorVars.text3,
    fontSize: fontSizeVars['14'],
    fontWeight: fontWeightVars.medium,
    lineHeight: lineHeightVars.sidebarItem,
    letterSpacing: '0.25px',
    width: '100%',
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

export const logo = style(
  {
    alignItems: 'center',
    display: 'flex',
    height: topNavVars.height,
    paddingTop: spaceVars[4],
  },
  'logo',
)

export const logoWrapper = style(
  {
    backgroundColor: primitiveColorVars.backgroundDark,
    position: 'sticky',
    top: 0,
    zIndex: zIndexVars.gutterTopCurtain,
    '@media': {
      'screen and (max-width: 1080px)': {
        display: 'none',
      },
    },
  },
  'logoWrapper',
)

export const section = style(
  {
    display: 'flex',
    flexDirection: 'column',
  },
  'section',
)

export const level = style(
  {
    gap: spaceVars['4'],
    paddingBottom: spaceVars['24'],
  },
  'level',
)

export const levelCollapsed = style(
  {
    gap: spaceVars['4'],
    paddingBottom: spaceVars['12'],
  },
  'levelCollapsed',
)

export const levelInset = style(
  {
    borderLeft: `1px solid ${primitiveColorVars.border}`,
    paddingLeft: spaceVars['16'],
  },
  'levelInset',
)

export const sectionHeader = style(
  {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  'sectionHeader',
)

export const sectionHeaderActive = style(
  {
    color: primitiveColorVars.text,
  },
  'sectionHeaderActive',
)

export const sectionTitle = style(
  {
    fontSize: fontSizeVars['14'],
    fontWeight: fontWeightVars.semibold,
    letterSpacing: '0.25px',
    width: '100%',
  },
  'sectionTitle',
)

export const sectionCollapse = style(
  {
    color: primitiveColorVars.text3,
    transform: 'rotate(90deg)',
    transition: 'transform 0.25s',
  },
  'sectionCollapse',
)

export const sectionCollapseActive = style(
  {
    transform: 'rotate(0)',
  },
  'sectionCollapseActive',
)
