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
    position: 'absolute',
    right: spaceVars[12],
  },
  'closeButton',
)

globalStyle(`${content} a`, {
  fontWeight: '400',
  textUnderlineOffset: '2px',
  textDecoration: 'underline',
})
