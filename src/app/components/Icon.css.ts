import { createVar, style } from '@vanilla-extract/css'

export const sizeVar = createVar('size')
export const srcVar = createVar('src')

export const root = style({
  alignItems: 'center',
  display: 'flex',
  height: sizeVar,
  width: sizeVar,
})
