import { style } from '@vanilla-extract/css'
import {
  borderRadiusVars,
  fontSizeVars,
  fontWeightVars,
  primitiveColorVars,
  spaceVars,
  viewportVars,
  zIndexVars,
} from '../styles/vars.css.js'
import * as buttonStyles from './Button.css.js'

export const root = style({
  display: 'flex',
  '@media': {
    [viewportVars['max-1080px']]: {
      display: 'none',
    },
  },
})

export const button = style(
  [
    buttonStyles.button,
    {
      selectors: {
        '&&': {
          alignItems: 'center',
          backgroundColor: primitiveColorVars.background,
          display: 'flex',
          gap: spaceVars[6],
          height: '32px',
          fontSize: fontSizeVars['12'],
        },
        '&:hover': {
          backgroundColor: primitiveColorVars.background2,
        },
        '&:focus-visible': {
          outline: 'none',
        },
      },
    },
  ],
  'button',
)

export const buttonLeft = style(
  [
    button,
    {
      selectors: {
        '&&': {
          borderTopRightRadius: '0px',
          borderBottomRightRadius: '0px',
          padding: `0 ${spaceVars[8]} 0 ${spaceVars[12]}`,
          width: '130px',
        },
      },
    },
  ],
  'buttonLeft',
)

export const buttonRight = style(
  [
    button,
    {
      selectors: {
        '&&': {
          borderTopLeftRadius: '0px',
          borderBottomLeftRadius: '0px',
          borderLeft: 'none',
          padding: `0 ${spaceVars[8]} 0 ${spaceVars[6]}`,
        },
      },
    },
  ],
  'buttonRight',
)

export const dropdownMenuContent = style(
  {
    backgroundColor: primitiveColorVars.background,
    borderRadius: borderRadiusVars[8],
    border: `1px solid ${primitiveColorVars.border}`,
    padding: `${spaceVars[4]} ${spaceVars[4]}`,
    zIndex: zIndexVars.popover,
  },
  'dropdownMenuContent',
)

export const dropdownMenuItem = style(
  {
    display: 'flex',
    alignItems: 'center',
    borderRadius: borderRadiusVars['4'],
    gap: spaceVars[8],
    cursor: 'pointer',
    fontSize: fontSizeVars[12],
    fontWeight: fontWeightVars.medium,
    padding: `0 ${spaceVars[8]}`,
    selectors: {
      '&:hover': {
        backgroundColor: primitiveColorVars.background2,
      },
      '&:focus-visible': {
        outline: 'none',
      },
    },
  },
  'dropdownMenuItem',
)
