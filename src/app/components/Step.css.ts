import { globalStyle, style } from '@vanilla-extract/css'

import { fontWeightVars, primitiveColorVars, spaceVars, viewportVars } from '../styles/vars.css.js'
import { root as Tabs } from './Tabs.css.js'
import { root as CodeBlock } from './mdx/CodeBlock.css.js'
import { root as H2 } from './mdx/H2.css.js'
import { root as H3 } from './mdx/H3.css.js'
import { root as H4 } from './mdx/H4.css.js'
import { root as H5 } from './mdx/H5.css.js'
import { root as H6 } from './mdx/H6.css.js'

export const root = style({
  selectors: {
    '&:not(:last-child)': {
      marginBottom: spaceVars['24'],
    },
  },
})

export const title = style(
  {
    marginBottom: spaceVars['8'],
    position: 'relative',
    '::before': {
      alignItems: 'center',
      backgroundColor: primitiveColorVars.background5,
      borderRadius: '100%',
      border: `0.5em solid ${primitiveColorVars.background}`,
      boxSizing: 'content-box',
      color: primitiveColorVars.text2,
      content: 'counter(step)',
      counterIncrement: 'step',
      display: 'flex',
      fontSize: '0.625em',
      fontWeight: fontWeightVars.regular,
      height: '2em',
      justifyContent: 'center',
      left: 'calc(-25.125px - 1.45em)',
      position: 'absolute',
      top: '-0.25em',
      width: '2em',
    },
  },
  'title',
)

export const content = style(
  {
    selectors: {
      [`${H2}+&,${H3}+&,${H4}+&,${H5}+&,${H6}+&`]: {
        marginTop: `calc(${spaceVars['8']} * -1)`,
      },
    },
  },
  'content',
)

globalStyle(`${content} > *:not(:last-child)`, {
  marginBottom: spaceVars['16'],
})

globalStyle(`${content} > *:last-child`, {
  marginBottom: spaceVars['0'],
})

globalStyle(`${content} > ${Tabs}, ${content} > ${CodeBlock}`, {
  '@media': {
    [viewportVars['max-720px']]: {
      outline: `6px solid ${primitiveColorVars.background}`,
      marginLeft: `calc(-1 * ${spaceVars['44']} - 2px)`,
      marginRight: `calc(-1 * ${spaceVars['16']})`,
    },
  },
})

globalStyle(`${content} ${Tabs} pre.shiki`, {
  '@media': {
    [viewportVars['max-720px']]: {
      borderTop: 'none',
    },
  },
})
