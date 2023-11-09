import { style } from '@vanilla-extract/css'

import { borderRadiusVars, primitiveColorVars, spaceVars, zIndexVars } from '../styles/vars.css.js'
import { root as Pre } from './mdx/Pre.css.js'

export const root = style({
  alignItems: 'center',
  backgroundColor: `color-mix(in srgb, ${primitiveColorVars.background2} 75%, transparent)`,
  backdropFilter: 'blur(1px)',
  border: `1px solid ${primitiveColorVars.border}`,
  borderRadius: borderRadiusVars['4'],
  color: primitiveColorVars.text3,
  display: 'flex',
  justifyContent: 'center',
  position: 'absolute',
  right: spaceVars['18'],
  top: spaceVars['18'],
  opacity: 0,
  height: '32px',
  width: '32px',
  transition: 'background-color 0.15s, opacity 0.15s',
  zIndex: zIndexVars.surface,
  selectors: {
    '&:hover': {
      backgroundColor: primitiveColorVars.background4,
      transition: 'background-color 0.05s',
    },
    '&:focus-visible': {
      backgroundColor: primitiveColorVars.background4,
      opacity: 1,
      transition: 'background-color 0.05s',
    },
    '&:hover:active': {
      backgroundColor: primitiveColorVars.background2,
    },
    [`${Pre}:hover &`]: {
      opacity: 1,
    },
  },
})
