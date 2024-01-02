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
    transition: 'color 0.1s, border-color 0.1s',
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
