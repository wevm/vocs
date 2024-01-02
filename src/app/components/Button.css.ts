import { style } from '@vanilla-extract/css'
import {
  borderRadiusVars,
  fontSizeVars,
  fontWeightVars,
  primitiveColorVars,
  spaceVars,
} from '../styles/vars.css.js'

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
    transition: 'background 0.1s',
    selectors: {
      '&:hover': {
        background: primitiveColorVars.background3,
      },
    },
    whiteSpace: 'pre',
    width: 'fit-content',
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
