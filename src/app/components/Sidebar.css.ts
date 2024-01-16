import { style } from '@vanilla-extract/css'
import {
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
  sidebarVars,
  spaceVars,
  topNavVars,
  zIndexVars,
} from '../styles/vars.css.js'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  fontSize: fontSizeVars['14'],
  overflowY: 'auto',
  width: sidebarVars.width,
  '@media': {
    'screen and (max-width: 1080px)': {
      width: '100%',
    },
  },
})

export const backLink = style(
  {
    textAlign: 'left',
  },
  'backLink',
)

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

export const group = style(
  {
    display: 'flex',
    flexDirection: 'column',
  },
  'group',
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
    fontSize: '1em',
    get selectors() {
      return {
        [`${navigation} > ${group} > ${section} + ${section}`]: {
          borderTop: `1px solid ${primitiveColorVars.border}`,
        },
      }
    },
  },
  'section',
)

export const level = style({}, 'level')

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
    fontSize: fontSizeVars['13'],
    marginTop: spaceVars['8'],
    paddingLeft: spaceVars['12'],
    selectors: {
      '&&&': {
        fontWeight: fontWeightVars.regular,
        paddingTop: 0,
        paddingBottom: 0,
      },
    },
  },
  'levelInset',
)

export const items = style(
  {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.625em',
    paddingTop: spaceVars['16'],
    paddingBottom: spaceVars['16'],
    fontWeight: fontWeightVars.medium,
    selectors: {
      [`${level} &`]: {
        paddingTop: spaceVars['6'],
      },
    },
  },
  'items',
)

export const item = style(
  {
    color: primitiveColorVars.text3,
    letterSpacing: '0.25px',
    lineHeight: lineHeightVars.sidebarItem,
    width: '100%',
    transition: 'color 0.1s',
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

export const sectionHeader = style(
  {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    selectors: {
      [`${level} > &`]: {
        paddingTop: spaceVars['12'],
      },
    },
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
    color: primitiveColorVars.title,
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
