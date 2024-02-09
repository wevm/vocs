import { createVar, style } from '@vanilla-extract/css'

export const arrowColor = createVar('arrowColor')

export const root = style({
  selectors: {
    '&::after': {
      backgroundColor: 'currentColor',
      content: '',
      color: arrowColor,
      display: 'inline-block',
      height: '0.5em',
      marginLeft: '0.325em',
      marginRight: '0.25em',
      width: '0.5em',
      mask: 'url(.vocs/icons/arrow-diagonal.svg) no-repeat center / contain',
    },
  },
})
