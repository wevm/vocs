import { style } from '@vanilla-extract/css'

export const root = style({
  selectors: {
    '&::after': {
      backgroundColor: 'currentColor',
      content: '',
      display: 'inline-block',
      height: '0.5em',
      marginLeft: '0.325em',
      width: '0.5em',
      mask: 'url(/icons/arrow-diagonal.svg) no-repeat center / contain',
    },
  },
})
