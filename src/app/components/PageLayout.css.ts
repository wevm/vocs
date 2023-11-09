import { createVar, style } from '@vanilla-extract/css'
import {
  contentVars,
  primitiveColorVars,
  sidebarVars,
  spaceVars,
  topNavVars,
  viewportVars,
  zIndexVars,
} from '../styles/vars.css.js'

const leftGutterWidthVar = createVar('leftGutterWidth')

export const root = style({
  vars: {
    [leftGutterWidthVar]: `max(calc((100vw - ${contentVars.width}) / 2), ${sidebarVars.width})`,
  },
})

export const content = style(
  {
    marginLeft: leftGutterWidthVar,
    maxWidth: contentVars.width,
    minHeight: `calc(100vh - (${topNavVars.height} + ${topNavVars.curtainHeight}))`,
    '@media': {
      [viewportVars['min-1080px']]: {
        paddingTop: topNavVars.height,
      },
      [viewportVars['max-1080px']]: {
        display: 'flex',
        marginLeft: 'auto',
        marginRight: 'auto',
      },
    },
  },
  'content',
)

export const gutterLeft = style(
  {
    backgroundColor: primitiveColorVars.backgroundDark,
    justifyContent: 'flex-end',
    display: 'flex',
    height: '100vh',
    position: 'fixed',
    width: leftGutterWidthVar,
    zIndex: zIndexVars.gutterLeft,
    '@media': {
      [viewportVars['max-1080px']]: {
        display: 'none',
      },
    },
  },
  'gutterLeft',
)

export const gutterTop = style(
  {
    alignItems: 'center',
    height: topNavVars.height,
    width: '100vw',
    zIndex: zIndexVars.gutterTop,
    '@media': {
      [viewportVars['min-1080px']]: {
        paddingLeft: leftGutterWidthVar,
        paddingRight: `calc(${leftGutterWidthVar} - ${sidebarVars.width})`,
        position: 'fixed',
        top: 0,
      },
      [viewportVars['max-1080px']]: {
        position: 'initial',
      },
    },
  },
  'gutterTop',
)

export const gutterTopCurtain = style(
  {
    display: 'flex',
    height: topNavVars.curtainHeight,
    width: '100vw',
    zIndex: zIndexVars.gutterTop,
    '@media': {
      [viewportVars['min-1080px']]: {
        marginLeft: leftGutterWidthVar,
        position: 'fixed',
        top: topNavVars.height,
      },
      [viewportVars['max-1080px']]: {
        position: 'sticky',
        top: 0,
      },
    },
  },
  'gutterTopCurtain',
)

export const gutterRight = style(
  {
    display: 'flex',
    height: '100vh',
    overflow: 'scroll',
    padding: `calc(${contentVars.verticalPadding} + ${topNavVars.height}) ${spaceVars['24']} 0 0`,
    position: 'fixed',
    top: '0',
    right: '0',
    width: `calc(100vw - ${contentVars.width} - ${leftGutterWidthVar})`,
    zIndex: zIndexVars.gutterRight,
    '@media': {
      [viewportVars['max-1280px']]: {
        display: 'none',
      },
    },
  },
  'gutterRight',
)

export const outlinePopover = style(
  {
    display: 'none',
    '@media': {
      [viewportVars['max-1080px']]: {
        display: 'block',
      },
    },
  },
  'outlinePopover',
)

export const sidebarDrawer = style(
  {
    display: 'none',
    '@media': {
      [viewportVars['max-1080px']]: {
        display: 'block',
      },
    },
  },
  'sidebarDrawer',
)
