import { style } from '@vanilla-extract/css'
import { leftGutterWidthVar } from '../layouts/DocsLayout.css.js'
import {
  borderRadiusVars,
  primitiveColorVars,
  sidebarVars,
  spaceVars,
  topNavVars,
  viewportVars,
} from '../styles/vars.css.js'

export const root = style({
  alignItems: 'center',
  backgroundColor: `color-mix(in srgb, ${primitiveColorVars.background} 98%, transparent)`,
  display: 'flex',
  justifyContent: 'space-between',
  padding: `0 ${topNavVars.horizontalPadding}`,
  height: topNavVars.height,
  '@media': {
    [viewportVars['max-1080px']]: {
      display: 'none',
    },
  },
})

export const button = style(
  {
    borderRadius: borderRadiusVars[4],
    padding: spaceVars[8],
  },
  'button',
)

export const curtain = style(
  {
    background: `linear-gradient(${primitiveColorVars.background}, transparent 70%)`,
    height: '30px',
    opacity: 0.98,
    width: '100%',
    '@media': {
      [viewportVars['max-1080px']]: {
        display: 'none',
      },
    },
  },
  'curtain',
)

export const divider = style(
  {
    backgroundColor: primitiveColorVars.border,
    height: '35%',
    width: '1px',
  },
  'divider',
)

export const group = style({ alignItems: 'center', display: 'flex' }, 'group')

export const icon = style(
  {
    color: primitiveColorVars.text2,
    selectors: {
      [`${button}:hover &`]: {
        color: primitiveColorVars.text,
      },
    },
  },
  'icon',
)

export const item = style({ alignItems: 'center', display: 'flex', height: '100%' }, 'item')

export const logo = style(
  {
    paddingLeft: sidebarVars.horizontalPadding,
    paddingRight: sidebarVars.horizontalPadding,
    width: sidebarVars.width,
  },
  'logo',
)

export const logoWrapper = style(
  {
    display: 'flex',
    height: '100%',
    justifyContent: 'flex-end',
    left: 0,
    position: 'absolute',
    width: leftGutterWidthVar,
  },
  'logoWrapper',
)

export const section = style(
  { alignItems: 'center', display: 'flex', height: '100%', gap: spaceVars[24] },
  'section',
)
