import { createVar, keyframes, style } from '@vanilla-extract/css'
import {
  borderRadiusVars,
  fontSizeVars,
  fontWeightVars,
  primitiveColorVars,
  spaceVars,
  zIndexVars,
} from '../styles/vars.css.js'

const fadeIn = keyframes(
  {
    from: {
      opacity: 0,
      transform: 'translateY(-6px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0px)',
    },
  },
  'fadeIn',
)

export const root = style({})

export const list = style(
  {
    display: 'flex',
    gap: spaceVars[20],
  },
  'list',
)

export const link = style(
  {
    alignItems: 'center',
    display: 'flex',
    fontSize: fontSizeVars[14],
    fontWeight: fontWeightVars.medium,
    height: '100%',
    selectors: {
      '&:hover': { color: primitiveColorVars.textAccent },
      '&[data-active="true"]': { color: primitiveColorVars.textAccent },
    },
  },
  'link',
)

export const item = style({}, 'item')

export const chevronDownIcon = createVar('chevronDownIcon')

export const trigger = style(
  [
    link,
    {
      selectors: {
        '&::after': {
          backgroundColor: 'currentColor',
          content: '',
          color: primitiveColorVars.text3,
          display: 'inline-block',
          height: '0.625em',
          marginLeft: '0.325em',
          width: '0.625em',
          mask: `${chevronDownIcon} no-repeat center / contain`,
        },
      },
    },
  ],
  'trigger',
)

export const content = style(
  {
    backgroundColor: primitiveColorVars.background2,
    border: `1px solid ${primitiveColorVars.border}`,
    borderRadius: borderRadiusVars[4],
    boxShadow: `0 3px 10px ${primitiveColorVars.shadow}`,
    display: 'flex',
    flexDirection: 'column',
    padding: `${spaceVars['12']} ${spaceVars['16']}`,
    position: 'absolute',
    top: `calc(100% + ${spaceVars['8']})`,
    minWidth: '200px',
    zIndex: zIndexVars.popover,
    animation: `${fadeIn} 500ms cubic-bezier(0.16, 1, 0.3, 1)`,
  },
  'content',
)
