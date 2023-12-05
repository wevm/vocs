import { style } from '@vanilla-extract/css'

import {
  borderRadiusVars,
  fontFamilyVars,
  fontSizeVars,
  primitiveColorVars,
  spaceVars,
} from '../../styles/vars.css.js'

export const root = style({
  color: primitiveColorVars.text2,
  display: 'inline-block',
  borderRadius: borderRadiusVars['3'],
  fontSize: fontSizeVars['11'],
  fontFamily: fontFamilyVars.default,
  fontFeatureSettings: 'cv08',
  lineHeight: '105%',
  minWidth: '20px',
  padding: spaceVars['3'],
  paddingLeft: spaceVars['4'],
  paddingRight: spaceVars['4'],
  paddingTop: spaceVars['3'],
  textAlign: 'center',
  textTransform: 'capitalize',
  verticalAlign: 'baseline',

  border: `0.5px solid ${primitiveColorVars.border}`,
  backgroundColor: primitiveColorVars.background3,
  boxShadow: `${primitiveColorVars.shadow2} 0px 2px 0px 0px`,
})
