import { globalStyle, layer } from '@vanilla-extract/css'

import { root as Content } from '../components/Content.css.js'
import {
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
  spaceVars,
} from './vars.css.js'

const globalLayer = layer('global')

globalStyle(':root', {
  '@layer': {
    [globalLayer]: {
      backgroundColor: primitiveColorVars.background,
      color: primitiveColorVars.text,
      lineHeight: lineHeightVars.paragraph,
      fontSize: fontSizeVars.root,
      fontWeight: fontWeightVars.regular,
    },
  },
})

globalStyle(
  [
    ':root:not(.dark) pre[data-theme="dark"]',
    ':root:not(.dark) code[data-theme="dark"]',
    ':root:not(.dark) div[data-theme="dark"]',
    ':root.dark pre[data-theme="light"]',
    ':root.dark code[data-theme="light"]',
    ':root.dark div[data-theme="light"]',
  ].join(','),
  {
    display: 'none',
  },
)

globalStyle(`${Content} > *:not(:last-child)`, {
  marginBottom: spaceVars['16'],
})

globalStyle(`${Content} > *:last-child`, {
  marginBottom: spaceVars['0'],
})
