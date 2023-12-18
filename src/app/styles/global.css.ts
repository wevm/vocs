import { globalStyle, layer } from '@vanilla-extract/css'

import { root as Callout } from '../components/Callout.css.js'
import { root as Content } from '../components/Content.css.js'
import { root as Details } from '../components/mdx/Details.css.js'
import {
  fontSizeVars,
  fontWeightVars,
  lineHeightVars,
  primitiveColorVars,
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

////////////////////////////////////////////////////////////////////////
// Rehype Pretty Code

globalStyle(':root:not(.dark) [data-rehype-pretty-code-figure] span:not([data-line])', {
  color: 'var(--shiki-light)',
  backgroundColor: 'var(--shiki-light-bg)',
})
globalStyle(':root.dark [data-rehype-pretty-code-figure] span:not([data-line])', {
  color: 'var(--shiki-dark)',
  backgroundColor: 'var(--shiki-dark-bg)',
})

////////////////////////////////////////////////////////////////////////
// Shikiji Twoslash

globalStyle(':root .twoslash-popup-info', {
  vars: {
    '--shiki-light-bg': primitiveColorVars.background2,
  },
})
globalStyle(':root.dark .twoslash-popup-info', {
  vars: {
    '--shiki-dark-bg': primitiveColorVars.background2,
  },
})

globalStyle('.twoslash', {
  vars: {
    '--twoslash-popup-bg': primitiveColorVars.background2,
  },
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
