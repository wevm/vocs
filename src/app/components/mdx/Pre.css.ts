import { globalStyle, style } from '@vanilla-extract/css'
import { spaceVars, viewportVars } from '../../styles/vars.css.js'

export const root = style({
  selectors: {
    '&&': {
      '@media': {
        [viewportVars['max-720px']]: {
          borderRadius: 0,
          marginLeft: `calc(-1 * ${spaceVars['16']})`,
          marginRight: `calc(-1 * ${spaceVars['16']})`,
        },
      },
    },
  },
})

globalStyle(`${root}${root} [data-line]`, {
  '@media': {
    [viewportVars['max-720px']]: {
      padding: `0 ${spaceVars['16']}`,
    },
  },
})

globalStyle(`${root}${root} [data-line].diff::before`, {
  '@media': {
    [viewportVars['max-720px']]: {
      left: spaceVars['6'],
    },
  },
})
