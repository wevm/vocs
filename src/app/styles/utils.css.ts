import { globalStyle, style } from '@vanilla-extract/css'

export const visibleDark = style({}, 'visibleDark')
globalStyle(`:root:not(.dark) ${visibleDark}`, {
  display: 'none',
})

export const visibleLight = style({}, 'visibleLight')
globalStyle(`:root.dark ${visibleLight}`, {
  display: 'none',
})

export const visuallyHidden = style(
  {
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: 1,
  },
  'visuallyHidden',
)
