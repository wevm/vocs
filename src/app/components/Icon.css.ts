import { createVar, style } from '@vanilla-extract/css'

export const sizeVar = createVar('size')
export const srcVar = createVar('src')

export const root = style({
  backgroundColor: 'currentColor',
  mask: `${srcVar} no-repeat center / contain`,
  height: sizeVar,
  width: sizeVar,
})
