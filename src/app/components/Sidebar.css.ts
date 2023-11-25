import { globalStyle, style } from '@vanilla-extract/css'
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
  display: 'flex',
  flexDirection: 'column',
  gap: spaceVars['12'],
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
    '@media': {
      'screen and (max-width: 1080px)': {
        display: 'none',
      },
    },
  },
  'logoWrapper',
)

export const navigation = style(
  {
    selectors: {
      '&:first-child': {
        paddingTop: spaceVars['16'],
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
