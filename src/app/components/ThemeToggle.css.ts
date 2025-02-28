import { style } from '@vanilla-extract/css'
import { borderRadiusVars, primitiveColorVars, spaceVars } from '../styles/vars.css.js'

export const root = style({
  border: `1px solid ${primitiveColorVars.border}`,
  borderRadius: borderRadiusVars.round,
  display: 'flex',
  gap: spaceVars['8'],
  padding: spaceVars['4'],
})

export const themeToggleButton = style(
  {
    color: primitiveColorVars.text4,
    selectors: {
      '&:hover': {
        color: primitiveColorVars.textHover,
      },
      '&[data-active="true"]': {
        color: primitiveColorVars.textHover,
      },
    },
  },
  'themeToggleButton',
)
