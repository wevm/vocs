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
    background: primitiveColorVars.background3,
    border: `1px solid ${primitiveColorVars.border}`,
    borderRadius: borderRadiusVars.round,
    color: primitiveColorVars.text,
    display: 'flex',
    fontSize: fontSizeVars['14'],
    fontWeight: fontWeightVars.medium,
    height: '40px',
    padding: `0 ${spaceVars['18']}`,
    transition: 'background 0.1s',
    selectors: {
      '&:hover': {
        background: primitiveColorVars.background4,
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
    border: `1px solid ${primitiveColorVars.borderAccent}`,
    color: primitiveColorVars.backgroundAccentText,
    selectors: {
      '&:hover': {
        background: primitiveColorVars.backgroundAccentHover,
      },
    },
  },
  'button_accent',
)
