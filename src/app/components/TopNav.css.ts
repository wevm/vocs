import { keyframes, style } from '@vanilla-extract/css'
import {
  contentVars,
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
  spaceVars,
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

export const upper = style(
  {
    alignItems: 'center',
    backgroundColor: primitiveColorVars.backgroundDark,
    borderBottom: `1px solid ${primitiveColorVars.border}`,
    display: 'flex',
    height: '100%',
    padding: `${spaceVars['0']} ${contentVars.horizontalPadding}`,
    width: '100%',
  },
  'upper',
)

export const lower = style(
  {
    alignItems: 'center',
    backgroundColor: primitiveColorVars.backgroundDark,
    borderBottom: `1px solid ${primitiveColorVars.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: fontSizeVars['13'],
    fontWeight: fontWeightVars.medium,
    height: '100%',
    padding: `${spaceVars['0']} ${contentVars.horizontalPadding}`,
    width: '100%',
  },
  'lower',
)

export const lowerGroup = style(
  {
    alignItems: 'center',
    display: 'flex',
    gap: spaceVars['12'],
  },
  'lowerGroup',
)

export const lowerItem = style({}, 'lowerItem')

export const menuTrigger = style(
  {
    alignItems: 'center',
    display: 'flex',
    gap: spaceVars['8'],
  },
  'menuTrigger',
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

export const separator = style(
  {
    backgroundColor: primitiveColorVars.border,
    height: '1.75em',
    width: '1px',
  },
  'separator',
)

export const title = style(
  {
    fontSize: fontSizeVars['18'],
    fontWeight: fontWeightVars.semibold,
    lineHeight: lineHeightVars.heading,
  },
  'title',
)
