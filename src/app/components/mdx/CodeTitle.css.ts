import { style } from '@vanilla-extract/css'
import {
  fontSizeVars,
  fontWeightVars,
  primitiveColorVars,
  semanticColorVars,
  spaceVars,
  viewportVars,
} from '../../styles/vars.css.js'
import { root as CodeGroup } from './CodeGroup.css.js'

export const root = style({
  alignItems: 'center',
  backgroundColor: semanticColorVars.codeTitleBackground,
  borderBottom: `1px solid ${primitiveColorVars.border}`,
  color: primitiveColorVars.text3,
  display: 'flex',
  fontSize: fontSizeVars['14'],
  fontWeight: fontWeightVars.medium,
  gap: spaceVars['6'],
  padding: `${spaceVars['8']} ${spaceVars['24']}`,
  '@media': {
    [viewportVars['max-720px']]: {
      borderRadius: 0,
      paddingLeft: spaceVars['16'],
      paddingRight: spaceVars['16'],
    },
  },
  selectors: {
    [`${CodeGroup} &`]: {
      display: 'none',
    },
  },
})
