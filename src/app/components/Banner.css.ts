import { createVar, fallbackVar, globalStyle, style } from '@vanilla-extract/css'
import {
  fontSizeVars,
  primitiveColorVars,
  spaceVars,
  viewportVars,
  zIndexVars,
} from '../styles/vars.css.js'

export const bannerBackgroundColor = createVar('bannerBackgroundColor')
export const bannerHeight = createVar('bannerHeight')
export const bannerTextColor = createVar('bannerTextColor')

export const root = style({
  backgroundColor: fallbackVar(bannerBackgroundColor, primitiveColorVars.backgroundAccent),
  borderBottom: `1px solid ${fallbackVar(bannerBackgroundColor, primitiveColorVars.borderAccent)}`,
  color: fallbackVar(bannerTextColor, primitiveColorVars.backgroundAccentText),
  height: fallbackVar(bannerHeight, '36px'),
  position: 'fixed',
  top: 0,
  width: '100%',
  zIndex: zIndexVars.gutterTop,
  '@media': {
    [viewportVars['max-1080px']]: {
      position: 'initial',
    },
  },
})

export const content = style(
  {
    fontSize: fontSizeVars[14],
    overflowX: 'scroll',
    paddingLeft: spaceVars[8],
    paddingRight: spaceVars[8],
    marginRight: spaceVars[24],
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',
    whiteSpace: 'pre',
    '::-webkit-scrollbar': {
      display: 'none',
    },
  },
  'content',
)

export const inner = style(
  {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  'inner',
)

export const closeButton = style(
  {
    alignItems: 'center',
    backgroundColor: fallbackVar(bannerBackgroundColor, primitiveColorVars.backgroundAccent),
    display: 'flex',
    justifyContent: 'center',
    height: '100%',
    position: 'absolute',
    right: 0,
    width: spaceVars[24],
  },
  'closeButton',
)

globalStyle(`${content} a`, {
  fontWeight: '400',
  textUnderlineOffset: '2px',
  textDecoration: 'underline',
})
