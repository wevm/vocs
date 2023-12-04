import { style } from '@vanilla-extract/css'
import { primitiveColorVars, spaceVars } from '../styles/vars.css.js'

export const root = style({
  alignItems: 'center',
  display: 'flex',
  flexDirection: 'column',
  maxWidth: '400px',
  margin: '0 auto',
  paddingTop: spaceVars['64'],
})

export const divider = style(
  {
    borderColor: primitiveColorVars.border,
    width: '50%',
  },
  'divider',
)
