import { style } from '@vanilla-extract/css'

import {
  borderRadiusVars,
  fontSizeVars,
  fontWeightVars,
  primitiveColorVars,
  spaceVars,
} from '../styles/vars.css.js'

export const search = style(
  {
    alignItems: 'center',
    backgroundColor: primitiveColorVars.backgroundDark,
    border: `1px solid ${primitiveColorVars.backgroundDark}`,
    borderRadius: borderRadiusVars[8],
    color: primitiveColorVars.text2,
    display: 'flex',
    fontSize: fontSizeVars[14],
    fontWeight: fontWeightVars.medium,
    gap: spaceVars[6],
    height: spaceVars[40],
    maxWidth: '15.5rem',
    paddingLeft: spaceVars[12],
    paddingRight: spaceVars[12],
    position: 'relative',
    width: '100%',
    selectors: {
      '&:hover': {
        color: primitiveColorVars.text,
        borderColor: primitiveColorVars.text3,
      },
    },
  },
  'search',
)

export const searchCommand = style(
  {
    alignItems: 'center',
    border: `1.5px solid ${primitiveColorVars.text3}`,
    borderRadius: borderRadiusVars[4],
    color: primitiveColorVars.text3,
    display: 'flex',
    height: spaceVars[12],
    justifyContent: 'center',
    marginLeft: 'auto',
    marginTop: spaceVars[1],
    padding: spaceVars[1],
    width: spaceVars[12],
  },
  'searchCommand',
)

export const dialogOverlay = style(
  {
    WebkitBackdropFilter: 'blur(0.25rem)',
    backdropFilter: 'blur(0.25rem)',
    position: 'fixed',
    inset: 0,
    animation: 'overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
  'dialogOverlay',
)

// TODO: Box shadow
export const dialogContent = style(
  {
    backgroundColor: primitiveColorVars.background,
    border: `1px solid ${primitiveColorVars.backgroundDark}`,
    borderRadius: borderRadiusVars[8],
    position: 'fixed',
    top: '0',
    left: '50%',
    transform: 'translate(-50%)',
    width: '90vw',
    maxWidth: '40rem',
    maxHeight: '90vh',
    marginTop: spaceVars[64],
    minHeight: '15rem',
    padding: '1.5rem',
    animation: 'contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
  'dialogContent',
)
