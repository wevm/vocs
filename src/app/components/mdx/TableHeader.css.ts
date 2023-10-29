import { style } from '@vanilla-extract/css'
import {
  fontSizeVars,
  fontWeightVars,
  semanticColorVars,
  spaceVars,
} from '../../styles/vars.css.js'

export const root = style({
  border: `1px solid ${semanticColorVars.tableBorder}`,
  backgroundColor: semanticColorVars.tableHeaderBackground,
  color: semanticColorVars.tableHeaderText,
  fontSize: fontSizeVars.th,
  fontWeight: fontWeightVars.medium,
  padding: `${spaceVars['8']} ${spaceVars['12']}`,
  textAlign: 'left',
  selectors: {
    '&[align="center"]': {
      textAlign: 'center',
    },
    '&[align="right"]': {
      textAlign: 'right',
    },
  },
})
