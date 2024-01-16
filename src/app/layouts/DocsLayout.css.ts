import { createVar, fallbackVar, style } from '@vanilla-extract/css'
import { bannerHeight } from '../components/Banner.css.js'
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
    minHeight: '100vh',
    '@media': {
      [viewportVars['max-720px']]: {
        overflowX: 'hidden',
      },
      [viewportVars['max-1080px']]: {
        marginLeft: 'auto',
        marginRight: 'auto',
      },
    },
  },
  'content',
)

export const content_withTopNav = style(
  {
    '@media': {
      [viewportVars['min-1080px']]: {
        paddingTop: `calc(${topNavVars.height} + ${fallbackVar(bannerHeight, '0px')})`,
      },
    },
  },
  'content_withTopNav',
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
    top: fallbackVar(bannerHeight, '0px'),
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
    backgroundColor: `color-mix(in srgb, ${primitiveColorVars.background} 98%, transparent)`,
    height: topNavVars.height,
    width: '100vw',
    zIndex: zIndexVars.gutterTop,
    '@media': {
      [viewportVars['min-1080px']]: {
        paddingLeft: `calc(${leftGutterWidthVar} - ${sidebarVars.width})`,
        paddingRight: `calc(${leftGutterWidthVar} - ${sidebarVars.width})`,
        position: 'fixed',
        top: fallbackVar(bannerHeight, '0px'),
      },
      [viewportVars['max-1080px']]: {
        position: 'initial',
      },
    },
  },
  'gutterTop',
)

export const gutterTop_offsetLeftGutter = style(
  {
    '@media': {
      [viewportVars['min-1080px']]: {
        paddingLeft: leftGutterWidthVar,
      },
    },
  },
  'gutterTop_offsetLeftGutter',
)

export const gutterTop_sticky = style(
  {
    '@media': {
      [viewportVars['max-1080px']]: {
        position: 'sticky',
        top: 0,
      },
    },
  },
  'gutterTop_sticky',
)

export const gutterTopCurtain = style(
  {
    display: 'flex',
    height: topNavVars.curtainHeight,
    width: '100vw',
    zIndex: zIndexVars.gutterTopCurtain,
    '@media': {
      [viewportVars['min-1080px']]: {
        position: 'fixed',
        top: `calc(${topNavVars.height} + ${fallbackVar(bannerHeight, '0px')})`,
      },
      [viewportVars['max-1080px']]: {
        position: 'sticky',
        top: 0,
      },
    },
  },
  'gutterTopCurtain',
)

export const gutterTopCurtain_hidden = style(
  {
    background: 'unset',
    display: 'none',
  },
  'gutterTopCurtain_hidden',
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
    overflowY: 'auto',
    padding: `calc(${contentVars.verticalPadding} + ${topNavVars.height} + ${spaceVars['8']}) ${spaceVars['24']} 0 0`,
    position: 'fixed',
    top: fallbackVar(bannerHeight, '0px'),
    right: '0',
    width: `calc((100vw - ${contentVars.width}) / 2)`,
    zIndex: zIndexVars.gutterRight,
    '@media': {
      [viewportVars['max-1280px']]: {
        display: 'none',
      },
    },
    '::-webkit-scrollbar': {
      display: 'none',
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
    overflowY: 'auto',
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
    padding: `${spaceVars['0']} ${sidebarVars.horizontalPadding} ${spaceVars['24']} ${sidebarVars.horizontalPadding}`,
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
