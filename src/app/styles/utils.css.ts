import { globalStyle, style } from '@vanilla-extract/css'

export const visibleDark = style({}, 'visibleDark')
globalStyle(`:root:not(.dark) ${visibleDark}`, {
  display: 'none',
})

export const visibleLight = style({}, 'visibleLight')
globalStyle(`:root.dark ${visibleLight}`, {
  display: 'none',
})
