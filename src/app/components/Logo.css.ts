import { globalStyle, style } from '@vanilla-extract/css'
import { fontSizeVars, fontWeightVars, lineHeightVars } from '../styles/vars.css.js'

export const logoImage = style(
  {
    height: '30%',
    width: 'max-content',
  },
  'logoImage',
)

export const logoDark = style({}, 'logoDark')
globalStyle(`:root:not(.dark) ${logoDark}`, {
  display: 'none',
})

export const logoLight = style({}, 'logoLight')
globalStyle(`:root.dark ${logoLight}`, {
  display: 'none',
})

export const title = style(
  {
    fontSize: fontSizeVars['18'],
    fontWeight: fontWeightVars.semibold,
    lineHeight: lineHeightVars.heading,
  },
  'title',
)
