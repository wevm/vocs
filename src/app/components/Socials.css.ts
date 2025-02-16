import { style } from '@vanilla-extract/css'
import { primitiveColorVars, spaceVars } from '../styles/vars.css.js'

export const root = style({ display: 'flex', flexDirection: 'row', gap: spaceVars[8] })

export const button = style(
  {
    alignItems: 'center',
    display: 'flex',
    padding: spaceVars[4],
  },
  'button',
)

export const icon = style(
  {
    color: primitiveColorVars.text3,
    transition: 'color 0.1s',
    selectors: {
      [`${button}:hover &`]: {
        color: primitiveColorVars.textHover,
      },
    },
  },
  'icon',
)
