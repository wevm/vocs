import { globalStyle, style } from '@vanilla-extract/css'
import {
  borderRadiusVars,
  fontSizeVars,
  lineHeightVars,
  primitiveColorVars,
  semanticColorVars,
  spaceVars,
  viewportVars,
} from '../../styles/vars.css.js'
import { root as Callout } from '../Callout.css.js'
import { root as Tabs } from '../Tabs.css.js'

export const root = style({
  border: `1px solid ${semanticColorVars.codeInlineBorder}`,
  borderRadius: borderRadiusVars['4'],
  '@media': {
    [viewportVars['max-720px']]: {
      borderRadius: 0,
      borderRight: 'none',
      borderLeft: 'none',
      marginLeft: `calc(-1 * ${spaceVars['16']})`,
      marginRight: `calc(-1 * ${spaceVars['16']})`,
    },
  },
  selectors: {
    [`${Tabs} &, ${Callout} &`]: {
      border: 'none',
      marginLeft: 'unset',
      marginRight: 'unset',
    },
  },
})

globalStyle(`${root} code`, {
  display: 'grid',
  fontSize: fontSizeVars.codeBlock,
})

globalStyle(`${Callout} ${root} code`, {
  fontSize: fontSizeVars.calloutCodeBlock,
})

globalStyle(`${root} pre`, {
  backgroundColor: semanticColorVars.codeBlockBackground,
  borderRadius: borderRadiusVars['4'],
  overflowX: 'auto',
  padding: `${spaceVars['20']} ${spaceVars['0']}`,
  '@media': {
    [viewportVars['max-720px']]: {
      borderRadius: 0,
    },
  },
})

globalStyle(`${Callout} ${root} pre`, {
  backgroundColor: `color-mix(in srgb, ${semanticColorVars.codeBlockBackground} 65%, transparent) !important`,
  border: `1px solid ${semanticColorVars.codeInlineBorder}`,
  borderRadius: borderRadiusVars['4'],
  padding: `${spaceVars['12']} ${spaceVars['0']}`,
})

globalStyle(`${root} .line`, {
  borderLeft: '2px solid transparent',
  padding: `${spaceVars['0']} ${spaceVars['22']}`,
  lineHeight: lineHeightVars.code,
})
globalStyle(`${Callout} ${root} .line`, {
  padding: `${spaceVars['0']} ${spaceVars['12']}`,
})
globalStyle(`${root} .twoslash-popup-info .line`, {
  padding: `${spaceVars['0']} ${spaceVars['4']}`,
})
globalStyle(`${root} .twoslash-popup-info-hover .line`, {
  display: 'inline-block',
  padding: `${spaceVars['0']} ${spaceVars['8']}`,
})
globalStyle(`${root} .twoslash-error-line, ${root} .twoslash-tag-line`, {
  padding: `${spaceVars['0']} ${spaceVars['22']}`,
})

globalStyle(`${root} [data-line-numbers]`, {
  counterReset: 'line',
})

globalStyle(`${root} [data-line-numbers] > .line`, {
  padding: `${spaceVars['0']} ${spaceVars['16']}`,
})

globalStyle(`${root} [data-line-numbers] > .line::before`, {
  color: semanticColorVars.lineNumber,
  content: 'counter(line)',
  display: 'inline-block',
  fontSize: fontSizeVars.lineNumber,
  marginRight: spaceVars['16'],
  textAlign: 'right',
  width: '1rem',
})

globalStyle(`${root} [data-line-numbers] > .line:not(.diff.remove + .diff.add)::before`, {
  counterIncrement: 'line',
})

globalStyle(`${root} [data-line-numbers] > .line.diff::after`, {
  marginLeft: `calc(-1 * ${spaceVars['4']})`,
})

globalStyle(`${root} .highlighted`, {
  backgroundColor: semanticColorVars.codeHighlightBackground,
  borderLeft: `2px solid ${semanticColorVars.codeHighlightBorder}`,
  boxSizing: 'content-box',
})

globalStyle(`${root} .highlighted-word`, {
  borderRadius: borderRadiusVars['2'],
  backgroundColor: `${semanticColorVars.codeCharacterHighlightBackground} !important`,
  boxShadow: `0 0 0 4px ${semanticColorVars.codeCharacterHighlightBackground}`,
})

globalStyle(`${root} .has-diff`, {
  position: 'relative',
})

globalStyle(`${root} .line.diff::after`, {
  position: 'absolute',
  left: spaceVars['8'],
})

globalStyle(`${root} .line.diff.add`, {
  backgroundColor: primitiveColorVars.backgroundGreenTint2,
})

globalStyle(`${root} .line.diff.add::after`, {
  content: '+',
  color: primitiveColorVars.textGreen,
})

globalStyle(`${root} .line.diff.remove`, {
  backgroundColor: primitiveColorVars.backgroundRedTint2,
  opacity: '0.6',
})

globalStyle(`${root} .line.diff.remove > span`, {
  filter: 'grayscale(1)',
})

globalStyle(`${root} .line.diff.remove::after`, {
  content: '-',
  color: primitiveColorVars.textRed,
})

globalStyle(
  `${root} .has-focused > code > .line:not(.focused), ${root} .has-focused > code > .twoslash-meta-line:not(.focused)`,
  {
    opacity: '0.3',
    transition: 'opacity 0.2s',
  },
)

globalStyle(
  `${root}:hover .has-focused .line:not(.focused), ${root}:hover .has-focused .twoslash-meta-line:not(.focused)`,
  {
    opacity: '1',
    transition: 'opacity 0.2s',
  },
)

globalStyle(`${root} .line, ${root} .twoslash-error-line, ${root} .twoslash-tag-line`, {
  '@media': {
    [viewportVars['max-720px']]: {
      padding: `0 ${spaceVars['16']}`,
    },
  },
})

globalStyle(`${root} .line.diff::after`, {
  '@media': {
    [viewportVars['max-720px']]: {
      left: spaceVars['6'],
    },
  },
})
