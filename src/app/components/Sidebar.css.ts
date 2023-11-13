import { style } from '@vanilla-extract/css'
import {
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
  sidebarVars,
  spaceVars,
  topNavVars,
  viewportVars,
} from '../styles/vars.css.js'

export const root = style({
  backgroundColor: primitiveColorVars.backgroundDark,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  gap: spaceVars['12'],
  padding: `${spaceVars['0']} ${sidebarVars.horizontalPadding}`,
  width: sidebarVars.width,
  '@media': {
    'screen and (max-width: 1080px)': {
      width: '100%',
    },
  },
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

export const navigation = style(
  {
    selectors: {
      '&:first-child': {
        paddingTop: spaceVars['16'],
      },
    },
    '@media': {
      [viewportVars['max-1080px']]: {
        paddingTop: spaceVars['24'],
      },
    },
  },
  'navigation',
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

export const socialLink = style(
  {
    alignItems: 'center',
    display: 'flex',
    color: primitiveColorVars.text3,
    gap: spaceVars['8'],
    fontSize: fontSizeVars['14'],
    fontWeight: fontWeightVars.medium,
    selectors: {
      '&:hover': {
        color: primitiveColorVars.text,
      },
    },
  },
  'socialLink',
)

export const socialLinkIcon = style(
  {
    display: 'flex',
    justifyContent: 'center',
    width: '16px',
  },
  'socialLinkIcon',
)

export const socials = style(
  {
    borderTop: `1px solid ${primitiveColorVars.border}`,
    display: 'flex',
    flexDirection: 'column',
    paddingTop: spaceVars['12'],
    '@media': {
      [viewportVars['min-1080px']]: {
        display: 'none',
      },
    },
  },
  'socials',
)

export const title = style(
  {
    alignItems: 'center',
    borderBottom: `1px solid ${primitiveColorVars.border}`,
    display: 'flex',
    height: topNavVars.height,
    fontSize: fontSizeVars['18'],
    fontWeight: fontWeightVars.semibold,
    lineHeight: lineHeightVars.heading,
    '@media': {
      'screen and (max-width: 1080px)': {
        display: 'none',
      },
    },
  },
  'title',
)
