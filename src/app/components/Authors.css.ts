import { style } from '@vanilla-extract/css'
import { fontSizeVars, primitiveColorVars } from '../styles/vars.css.js'

export const root = style({
  color: primitiveColorVars.text3,
  fontSize: fontSizeVars[14],
})

export const authors = style(
  {
    color: primitiveColorVars.text,
  },
  'authors',
)

export const link = style(
  {
    textDecoration: 'underline',
    textUnderlineOffset: '2px',
    ':hover': {
      color: primitiveColorVars.text2,
    },
  },
  'link',
)

export const separator = style(
  {
    color: primitiveColorVars.text3,
  },
  'separator',
)
