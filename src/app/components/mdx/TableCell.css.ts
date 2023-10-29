import { style } from '@vanilla-extract/css'
import { fontSizeVars, semanticColorVars, spaceVars } from '../../styles/vars.css.js'

export const root = style({
  border: `1px solid ${semanticColorVars.tableBorder}`,
  fontSize: fontSizeVars.td,
  padding: `${spaceVars['8']} ${spaceVars['12']}`,
})
