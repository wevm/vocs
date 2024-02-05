import { globalStyle, layer } from '@vanilla-extract/css'

import { root as Callout } from '../components/Callout.css.js'
import { root as Content } from '../components/Content.css.js'
import { root as Details } from '../components/mdx/Details.css.js'
import {
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
  semanticColorVars,
  spaceVars,
  viewportVars,
} from './vars.css.js'

////////////////////////////////////////////////////////////////////////
// Root

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
  '@media': {
    [viewportVars['max-720px']]: {
      backgroundColor: primitiveColorVars.backgroundDark,
    },
  },
})

globalStyle(':root.dark', {
  colorScheme: 'dark',
})

////////////////////////////////////////////////////////////////////////
// Shiki

globalStyle(':root.dark pre.shiki span:not(.line), :root.dark :not(pre.shiki) .line span', {
  color: 'var(--shiki-dark) !important',
})
globalStyle('pre.shiki', {
  backgroundColor: `${semanticColorVars.codeBlockBackground} !important`,
})

////////////////////////////////////////////////////////////////////////
// Misc.

globalStyle(`${Content} > *:not(:last-child), ${Details} > *:not(:last-child)`, {
  marginBottom: spaceVars['24'],
})

globalStyle(`${Callout} > *:not(:last-child), ${Callout} > ${Details} > *:not(:last-child)`, {
  marginBottom: spaceVars['16'],
})

globalStyle(`${Content} > *:last-child, ${Callout} > *:last-child, ${Details} > *:last-child`, {
  marginBottom: spaceVars['0'],
})

globalStyle('#app[aria-hidden="true"]', {
  background: primitiveColorVars.background,
  // TODO: Do we need this? Breaks layout for dialogs
  // filter: 'brightness(0.5)',
})
