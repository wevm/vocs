import { style } from '@vanilla-extract/css'
import { fontSizeVars, fontWeightVars, primitiveColorVars, spaceVars } from '../styles/vars.css.js'

export const root = style({
  display: 'flex',
  flexDirection: 'column',
  gap: spaceVars['32'],
})

export const description = style(
  {
    marginTop: spaceVars['16'],
  },
  'description',
)

export const divider = style(
  {
    borderColor: primitiveColorVars.background4,
  },
  'divider',
)

export const post = style({}, 'post')

export const readMore = style(
  {
    selectors: {
      [`${post}:hover &`]: {
        color: primitiveColorVars.textAccent,
      },
    },
  },
  'readMore',
)

export const title = style(
  {
    fontSize: fontSizeVars.h2,
    fontWeight: fontWeightVars.semibold,
  },
  'title',
)
