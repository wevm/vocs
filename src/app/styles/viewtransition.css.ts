import { globalStyle } from '@vanilla-extract/css'

globalStyle('::view-transition-old(root), ::view-transition-new(root)', {
  animationDuration: 'var(--view-transition-duration)',
})
