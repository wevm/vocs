import { createVar, keyframes, style } from '@vanilla-extract/css'
import {
  borderRadiusVars,
  contentVars,
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
  sidebarVars,
  spaceVars,
  topNavVars,
  viewportVars,
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

export const root = style({
  alignItems: 'center',
  backgroundColor: primitiveColorVars.backgroundDark,
  borderBottom: `1px solid ${primitiveColorVars.border}`,
  display: 'none',
  height: '100%',
  justifyContent: 'space-between',
  padding: `${spaceVars['0']} ${contentVars.horizontalPadding}`,
  width: '100%',
  '@media': {
    [viewportVars['max-1080px']]: {
      display: 'flex',
    },
  },
})

export const button = style(
  {
    borderRadius: borderRadiusVars[4],
    padding: spaceVars[8],
  },
  'button',
)

export const content = style(
  {
    left: `calc(-1 * ${spaceVars['24']})`,
  },
  'content',
)

export const curtain = style(
  {
    alignItems: 'center',
    backgroundColor: primitiveColorVars.backgroundDark,
    borderBottom: `1px solid ${primitiveColorVars.border}`,
    display: 'none',
    justifyContent: 'space-between',
    fontSize: fontSizeVars['13'],
    fontWeight: fontWeightVars.medium,
    height: '100%',
    padding: `${spaceVars['0']} ${contentVars.horizontalPadding}`,
    width: '100%',
    '@media': {
      [viewportVars['max-1080px']]: {
        display: 'flex',
      },
    },
  },
  'curtain',
)

export const curtainGroup = style(
  {
    alignItems: 'center',
    display: 'flex',
    gap: spaceVars['12'],
  },
  'curtainGroup',
)

export const curtainItem = style({}, 'curtainItem')

export const divider = style(
  {
    backgroundColor: primitiveColorVars.border,
    height: '35%',
    width: '1px',
  },
  'divider',
)

export const group = style({ alignItems: 'center', display: 'flex', height: '100%' }, 'group')

export const icon = style(
  {
    color: primitiveColorVars.text2,
    transition: 'color 0.1s',
    selectors: {
      [`${button}:hover &`]: {
        color: primitiveColorVars.text,
      },
    },
  },
  'icon',
)

export const item = style(
  {
    position: 'relative',
  },
  'item',
)

export const logo = style(
  {
    alignItems: 'center',
    display: 'flex',
    height: topNavVars.height,
  },
  'logo',
)

export const logoImage = style(
  {
    height: '30%',
  },
  'logoImage',
)

export const menuTrigger = style(
  {
    alignItems: 'center',
    display: 'flex',
    gap: spaceVars['8'],
  },
  'menuTrigger',
)

export const menuTitle = style(
  {
    maxWidth: '22ch',
    overflow: 'hidden',
    textAlign: 'left',
    textOverflow: 'ellipsis',
    whiteSpace: 'pre',
  },
  'menuTitle',
)

export const navigation_compact = style({}, 'navigation_compact')

export const navigation = style(
  {
    marginLeft: spaceVars[8],
    selectors: {
      [`&:not(${navigation_compact})`]: {
        '@media': {
          [viewportVars['max-720px']]: {
            display: 'none',
          },
        },
      },
      [`&${navigation_compact}`]: {
        '@media': {
          [viewportVars['min-720px']]: {
            display: 'none',
          },
        },
      },
    },
  },
  'navigation',
)

export const navigationContent = style(
  {
    display: 'flex',
    flexDirection: 'column',
    marginLeft: spaceVars[8],
  },
  'navigationContent',
)

export const navigationItem = style(
  {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-start',
    fontSize: fontSizeVars[14],
    fontWeight: fontWeightVars.medium,
    width: '100%',
    selectors: {
      '&:hover': { color: primitiveColorVars.textAccent },
      '&[data-active="true"]': { color: primitiveColorVars.textAccent },
      '&[data-state="open"]': { color: primitiveColorVars.textAccent },
    },
  },
  'navigationItem',
)

export const chevronDownIcon = createVar('chevronDownIcon')
export const chevronUpIcon = createVar('chevronUpIcon')

export const navigationTrigger = style(
  {
    selectors: {
      '&::after': {
        backgroundColor: 'currentColor',
        content: '',
        display: 'inline-block',
        height: '0.625em',
        marginLeft: '0.325em',
        width: '0.625em',
        mask: `${chevronDownIcon} no-repeat center / contain`,
      },
      '&[data-state="open"]::after': {
        mask: `${chevronUpIcon} no-repeat center / contain`,
      },
    },
  },
  'trigger',
)

export const outlineTrigger = style(
  {
    animation: `${fadeIn} 500ms cubic-bezier(0.16, 1, 0.3, 1)`,
    alignItems: 'center',
    color: primitiveColorVars.text2,
    display: 'flex',
    gap: spaceVars['6'],
    selectors: {
      '&[data-state="open"]': {
        color: primitiveColorVars.textAccent,
      },
    },
  },
  'outlineTrigger',
)

export const outlinePopover = style(
  {
    display: 'none',
    overflowY: 'scroll',
    padding: spaceVars['16'],
    maxHeight: '80vh',
    '@media': {
      [viewportVars['max-1080px']]: {
        display: 'block',
        maxWidth: '300px',
      },
    },
  },
  'outlinePopover',
)

export const section = style(
  {
    alignItems: 'center',
    display: 'flex',
    height: '100%',
    gap: spaceVars[16],
  },
  'section',
)

export const separator = style(
  {
    backgroundColor: primitiveColorVars.border,
    height: '1.75em',
    width: '1px',
  },
  'separator',
)

export const sidebarPopover = style(
  {
    display: 'none',
    overflowY: 'scroll',
    padding: `0 ${sidebarVars.horizontalPadding}`,
    maxHeight: '80vh',
    width: sidebarVars.width,
    '@media': {
      [viewportVars['max-1080px']]: {
        display: 'block',
      },
    },
  },
  'sidebarPopover',
)

export const title = style(
  {
    fontSize: fontSizeVars['18'],
    fontWeight: fontWeightVars.semibold,
    lineHeight: lineHeightVars.heading,
  },
  'title',
)

export const topNavPopover = style(
  {
    display: 'none',
    overflowY: 'scroll',
    padding: `${sidebarVars.verticalPadding} ${sidebarVars.horizontalPadding}`,
    maxHeight: '80vh',
    width: sidebarVars.width,
    '@media': {
      [viewportVars['max-1080px']]: {
        display: 'flex',
        flexDirection: 'column',
      },
    },
  },
  'topNavPopover',
)
