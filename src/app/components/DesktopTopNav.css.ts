import { style } from '@vanilla-extract/css'
import {
  borderRadiusVars,
  primitiveColorVars,
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
    selectors: {
      '&:hover': {
        backgroundColor: primitiveColorVars.background3,
      },
      '&:hover:active': {
        backgroundColor: primitiveColorVars.background2,
      },
    },
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

export const item = style({ alignItems: 'center', display: 'flex', height: '100%' }, 'item')

export const section = style({ alignItems: 'center', display: 'flex', height: '100%' }, 'section')
