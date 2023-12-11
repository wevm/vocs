import { createVar, style } from '@vanilla-extract/css'
import {
  borderRadiusVars,
  fontSizeVars,
  fontWeightVars,
  primitiveColorVars,
  spaceVars,
} from '../styles/vars.css.js'

export const columnsVar = createVar('columns')
export const heightVar = createVar('height')

export const root = style({
  borderRadius: borderRadiusVars['8'],
  display: 'flex',
  flexDirection: 'column',
  gap: spaceVars['4'],
  overflow: 'hidden',
})

export const title = style(
  {
    backgroundColor: primitiveColorVars.background3,
    color: primitiveColorVars.text3,
    fontSize: fontSizeVars['13'],
    fontWeight: fontWeightVars.medium,
    padding: `${spaceVars['4']} 0`,
    textAlign: 'center',
  },
  'title',
)

export const row = style(
  {
    display: 'flex',
    flexDirection: 'row',
    gap: spaceVars['4'],
  },
  'row',
)

export const column = style(
  {
    alignItems: 'center',
    backgroundColor: primitiveColorVars.background3,
    display: 'flex',
    justifyContent: 'center',
    padding: spaceVars['32'],
    width: `calc(${columnsVar} * 100%)`,
  },
  'column',
)

export const sponsor = style(
  {
    transition: 'background-color 0.1s',
    selectors: {
      '&:hover': {
        backgroundColor: primitiveColorVars.background5,
      },
      '.dark &:hover': {
        backgroundColor: primitiveColorVars.white,
      },
    },
  },
  'sponsor',
)

export const image = style(
  {
    filter: 'grayscale(1)',
    height: heightVar,
    transition: 'filter 0.1s',
    selectors: {
      '.dark &': {
        filter: 'grayscale(1) invert(1)',
      },
      [`${column}:hover &`]: {
        filter: 'none',
      },
    },
  },
  'image',
)
