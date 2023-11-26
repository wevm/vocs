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

export const leftGutterWidthVar = createVar('leftGutterWidth')

export const root = style({
  overflowX: 'hidden',
  vars: {
    [leftGutterWidthVar]: `max(calc((100vw - ${contentVars.width}) / 2), ${sidebarVars.width})`,
  },
})

export const content = style(
  {
    backgroundColor: primitiveColorVars.background,
    marginLeft: 'auto',
    marginRight: 'auto',
    maxWidth: contentVars.width,
    minHeight: `calc(100vh - (${topNavVars.height} + ${topNavVars.curtainHeight}))`,
    '@media': {
      [viewportVars['min-1080px']]: {
        paddingTop: topNavVars.height,
      },
      [viewportVars['max-1080px']]: {
        marginLeft: 'auto',
        marginRight: 'auto',
      },
    },
  },
  'content',
)

export const content_withSidebar = style(
  {
    marginLeft: leftGutterWidthVar,
    marginRight: 'unset',
  },
  'content_withSidebar',
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
        paddingLeft: `calc(${leftGutterWidthVar} - ${sidebarVars.width})`,
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

export const gutterTop_withSidebar = style(
  {
    '@media': {
      [viewportVars['min-1080px']]: {
        paddingLeft: leftGutterWidthVar,
      },
    },
  },
  'gutterTop_withSidebar',
)

export const gutterTopCurtain = style(
  {
    display: 'flex',
    height: topNavVars.curtainHeight,
    width: '100vw',
    zIndex: zIndexVars.gutterTop,
    '@media': {
      [viewportVars['min-1080px']]: {
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

export const gutterTopCurtain_withSidebar = style(
  {
    '@media': {
      [viewportVars['min-1080px']]: {
        marginLeft: leftGutterWidthVar,
      },
    },
  },
  'gutterTopCurtain_withSidebar',
)

export const gutterRight = style(
  {
    display: 'flex',
    height: '100vh',
    overflow: 'scroll',
    padding: `calc(${contentVars.verticalPadding} + ${topNavVars.height} + ${spaceVars['8']}) ${spaceVars['24']} 0 0`,
    position: 'fixed',
    top: '0',
    right: '0',
    width: `calc((100vw - ${contentVars.width}) / 2)`,
    zIndex: zIndexVars.gutterRight,
    '@media': {
      [viewportVars['max-1280px']]: {
        display: 'none',
      },
    },
  },
  'gutterRight',
)

export const gutterRight_withSidebar = style(
  {
    width: `calc(100vw - ${contentVars.width} - ${leftGutterWidthVar})`,
  },
  'gutterRight_withSidebar',
)

export const outlinePopover = style(
  {
    display: 'none',
    overflowY: 'scroll',
    height: `calc(100vh - ${topNavVars.height} - ${topNavVars.curtainHeight})`,
    '@media': {
      [viewportVars['max-1080px']]: {
        display: 'block',
      },
    },
  },
  'outlinePopover',
)

export const sidebar = style(
  {
    padding: `${spaceVars['0']} ${sidebarVars.horizontalPadding}`,
  },
  'sidebar',
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
