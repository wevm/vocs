import { style } from '@vanilla-extract/css'
import {
  borderRadiusVars,
  fontFamilyVars,
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
  spaceVars,
  viewportVars,
} from '../styles/vars.css.js'

export const root = style({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: spaceVars['64'],
  textAlign: 'center',
  gap: spaceVars['32'],
})

export const logo = style(
  {
    display: 'flex',
    height: '48px',
    '@media': {
      [viewportVars['max-720px']]: {
        height: '36px',
      },
    },
  },
  'logo',
)

export const tagline = style(
  {
    color: primitiveColorVars.text2,
    fontSize: fontSizeVars['20'],
    fontWeight: fontWeightVars.medium,
    lineHeight: '1.5em',
  },
  'tagline',
)

export const description = style(
  {
    color: primitiveColorVars.text,
    fontSize: fontSizeVars['16'],
    fontWeight: fontWeightVars.regular,
    lineHeight: lineHeightVars.paragraph,
    selectors: {
      [`${tagline} + &`]: {
        marginTop: `calc(-1 * ${spaceVars['8']})`,
      },
    },
  },
  'description',
)

export const buttons = style(
  {
    display: 'flex',
    gap: spaceVars['16'],
  },
  'buttons',
)

export const button = style(
  {
    alignItems: 'center',
    background: primitiveColorVars.background4,
    border: `1px solid ${primitiveColorVars.border}`,
    borderRadius: borderRadiusVars['4'],
    color: primitiveColorVars.text,
    display: 'flex',
    fontSize: fontSizeVars['14'],
    fontWeight: fontWeightVars.medium,
    height: '36px',
    padding: `0 ${spaceVars['16']}`,
    selectors: {
      '&:hover': {
        background: primitiveColorVars.background3,
      },
    },
  },
  'button',
)

export const button_accent = style(
  {
    background: primitiveColorVars.backgroundAccent,
    color: primitiveColorVars.backgroundAccentText,
    border: `1px solid ${primitiveColorVars.borderAccent}`,
    selectors: {
      '&:hover': {
        background: primitiveColorVars.backgroundAccentHover,
      },
    },
  },
  'button_accent',
)

export const tabs = style(
  {
    minWidth: '300px',
  },
  'tabs',
)

export const tabsList = style(
  {
    display: 'flex',
    justifyContent: 'center',
  },
  'tabsList',
)

export const tabsContent = style(
  {
    color: primitiveColorVars.text2,
    fontFamily: fontFamilyVars.mono,
  },
  'tabsContent',
)

export const packageManager = style(
  {
    color: primitiveColorVars.textAccent,
  },
  'packageManager',
)
