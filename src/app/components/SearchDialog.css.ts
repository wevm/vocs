import { globalStyle, keyframes, style } from '@vanilla-extract/css'

import {
  borderRadiusVars,
  fontSizeVars,
  fontWeightVars,
  primitiveColorVars,
  semanticColorVars,
  spaceVars,
  viewportVars,
  zIndexVars,
} from '../styles/vars.css.js'

const fadeIn = keyframes(
  {
    from: {
      opacity: 0,
    },
    to: {
      opacity: 1,
    },
  },
  'fadeIn',
)

const fadeAndSlideIn = keyframes(
  {
    from: {
      opacity: 0,
      transform: 'translate(-50%, -5%) scale(0.96)',
    },
    to: {
      opacity: 1,
      transform: 'translate(-50%, 0%) scale(1)',
    },
  },
  'fadeAndSlideIn',
)

export const root = style({
  animation: `${fadeAndSlideIn} 0.1s ease-in-out`,
  background: primitiveColorVars.background,
  borderRadius: borderRadiusVars[6],
  display: 'flex',
  flexDirection: 'column',
  gap: spaceVars[8],
  height: 'min-content',
  left: '50%',
  margin: '64px auto',
  maxHeight: 'min(100vh - 128px, 900px)',
  padding: spaceVars[12],
  paddingBottom: spaceVars[8],
  position: 'fixed',
  top: 0,
  transform: 'translate(-50%, 0%)',
  width: 'min(100vw - 60px, 775px)',
  zIndex: zIndexVars.backdrop,

  '@media': {
    [viewportVars['max-720px']]: {
      borderRadius: 0,
      // TODO: Not working
      height: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      margin: 0,
      maxHeight: 'unset',
      width: '100vw',
    },
  },
})

export const overlay = style(
  {
    animation: `${fadeIn} 0.1s ease-in-out`,
    // TODO: Refactor to variable
    background: 'rgba(0, 0, 0, .6)',
    position: 'fixed',
    inset: 0,
    zIndex: zIndexVars.backdrop,
  },
  'overlay',
)

export const searchBox = style(
  {
    alignItems: 'center',
    border: `1px solid ${primitiveColorVars.border}`,
    borderRadius: borderRadiusVars[4],
    display: 'flex',
    gap: spaceVars[8],
    paddingLeft: spaceVars[8],
    paddingRight: spaceVars[8],
    marginBottom: spaceVars[8],
    width: '100%',
    selectors: {
      '&:focus-within': {
        borderColor: primitiveColorVars.borderAccent,
      },
    },
  },
  'searchBox',
)

export const searchInput = style(
  {
    background: 'transparent',
    display: 'flex',
    fontSize: fontSizeVars[16],
    height: spaceVars[40],
    width: '100%',
    selectors: {
      '&:focus': {
        outline: 'none',
      },
      '&::placeholder': {
        color: primitiveColorVars.text4,
      },
    },
  },
  'searchInput',
)

export const searchInputIcon = style(
  {
    color: primitiveColorVars.text3,
  },
  'searchInputIcon',
)

export const searchInputIconDesktop = style(
  {
    '@media': {
      [viewportVars['max-720px']]: {
        display: 'none',
      },
    },
  },
  'searchInputIconDesktop',
)

export const searchInputIconMobile = style(
  {
    display: 'none',
    '@media': {
      [viewportVars['max-720px']]: {
        display: 'block',
      },
    },
  },
  'searchInputIconMobile',
)

export const results = style(
  {
    display: 'flex',
    flexDirection: 'column',
    gap: spaceVars[8],
    overflowX: 'hidden',
    overflowY: 'auto',
    overscrollBehavior: 'contain',
    width: '100%',
  },
  'results',
)

export const result = style(
  {
    border: `1.5px solid ${primitiveColorVars.border}`,
    borderRadius: borderRadiusVars[4],
    width: '100%',
    selectors: {
      '&:focus-within': {
        borderColor: primitiveColorVars.borderAccent,
      },
    },
  },
  'result',
)

globalStyle(`${result} > a`, {
  display: 'flex',
  flexDirection: 'column',
  gap: spaceVars[8],
  minHeight: spaceVars[36],
  outline: 'none',
  justifyContent: 'center',
  padding: spaceVars[12],
  width: '100%',
})

export const resultSelected = style(
  {
    borderColor: primitiveColorVars.borderAccent,
  },
  'resultSelected',
)

export const resultIcon = style(
  {
    color: primitiveColorVars.textAccent,
    marginRight: 1,
    width: 15,
  },
  'resultIcon',
)

export const titles = style(
  {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    fontWeight: fontWeightVars.medium,
    gap: spaceVars[4],
    lineHeight: '22px',
  },
  'titles',
)

export const title = style(
  {
    alignItems: 'center',
    display: 'flex',
    gap: spaceVars[4],
    whiteSpace: 'nowrap',
  },
  'title',
)

export const titleIcon = style(
  {
    color: primitiveColorVars.text,
    display: 'inline-block',
    opacity: 0.5,
  },
  'titleIcon',
)

globalStyle(`${resultSelected} ${title}, ${resultSelected} ${titleIcon}`, {
  color: primitiveColorVars.textAccent,
})

export const content = style({ padding: 0 }, 'content')

export const excerpt = style(
  {
    maxHeight: '8.75rem',
    overflow: 'hidden',
    opacity: 0.5,
    position: 'relative',
    '::before': {
      content: '',
      position: 'absolute',
      top: '-1px',
      left: 0,
      width: '100%',
      height: '8px',
      background: `linear-gradient(${primitiveColorVars.background}, transparent)`,
      zIndex: '1000',
    },
    '::after': {
      content: '',
      position: 'absolute',
      bottom: '-1px',
      left: 0,
      width: '100%',
      height: '12px',
      background: `linear-gradient(transparent, ${primitiveColorVars.background})`,
      zIndex: '1000',
    },
    '@media': {
      [viewportVars['max-720px']]: {
        opacity: 1,
      },
    },
  },
  'excerpt',
)

globalStyle(`${title} mark, ${excerpt} mark`, {
  backgroundColor: semanticColorVars.searchHighlightBackground,
  color: semanticColorVars.searchHighlightText,
  borderRadius: borderRadiusVars[2],
  paddingBottom: 0,
  paddingLeft: spaceVars[2],
  paddingRight: spaceVars[2],
  paddingTop: 0,
})

globalStyle(`${resultSelected} ${excerpt}`, {
  opacity: 1,
})

export const searchShortcuts = style(
  {
    alignItems: 'center',
    color: primitiveColorVars.text2,
    display: 'flex',
    gap: spaceVars[20],
    fontSize: fontSizeVars[14],

    '@media': {
      [viewportVars['max-720px']]: {
        display: 'none',
      },
    },
  },
  'searchShortcuts',
)

export const searchShortcutsGroup = style(
  {
    alignItems: 'center',
    display: 'inline-flex',
    gap: spaceVars[3],
    marginRight: spaceVars[6],
  },
  'searchShortcutsGroup',
)
