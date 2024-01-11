import { style } from '@vanilla-extract/css'
import {
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
  '@media': {
    [viewportVars['max-720px']]: {
      paddingTop: spaceVars['32'],
    },
  },
})

export const logo = style(
  {
    display: 'flex',
    justifyContent: 'center',
    height: '48px',
    '@media': {
      [viewportVars['max-720px']]: {
        height: '36px',
      },
    },
  },
  'logo',
)

export const title = style(
  {
    fontSize: fontSizeVars['64'],
    fontWeight: fontWeightVars.semibold,
    lineHeight: '1em',
  },
  'title',
)

export const tagline = style(
  {
    color: primitiveColorVars.text2,
    fontSize: fontSizeVars['20'],
    fontWeight: fontWeightVars.medium,
    lineHeight: '1.5em',
    selectors: {
      [`${title} + &`]: {
        marginTop: `calc(-1 * ${spaceVars['8']})`,
      },
    },
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

export const button = style({}, 'button')

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
