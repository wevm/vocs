import { globalStyle, style } from '@vanilla-extract/css'

export const root = style({})

export const logoDark = style({}, 'logoDark')
globalStyle(`:root:not(.dark) ${logoDark}`, {
  display: 'none',
})

export const logoLight = style({}, 'logoLight')
globalStyle(`:root.dark ${logoLight}`, {
  display: 'none',
})
