import { style } from '@vanilla-extract/css'
import { primitiveColorVars, spaceVars } from '../styles/vars.css.js'

export const root = style({ display: 'flex', flexDirection: 'row', gap: spaceVars[8] })

export const socialButton = style(
  {
    padding: spaceVars[4],
  },
  'social',
)

export const icon = style(
  {
    color: primitiveColorVars.text3,
    transition: 'color 0.1s',
    selectors: {
      [`${socialButton}:hover &`]: {
        color: primitiveColorVars.textHover,
      },
    },
  },
  'icon',
)
