import { style } from '@vanilla-extract/css'
import { spaceVars } from '../../styles/vars.css.js'

export const root = style({
  display: 'block',
  borderCollapse: 'collapse',
  overflowX: 'auto',
  marginBottom: spaceVars['24'],
})
