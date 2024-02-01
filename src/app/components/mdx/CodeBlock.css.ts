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
    [`${Tabs} &`]: {
      border: 'none',
      marginLeft: 'unset',
      marginRight: 'unset',
    },
  },
})

globalStyle(`${root} code`, {
  fontSize: fontSizeVars.codeBlock,
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
  backgroundColor: `color-mix(in srgb, ${semanticColorVars.codeBlockBackground} 65%, transparent)`,
  border: `1px solid ${semanticColorVars.codeInlineBorder}`,
  padding: `${spaceVars['12']} ${spaceVars['0']}`,
})

globalStyle(`${root} [data-rehype-pretty-code-title]+pre`, {
  borderTop: 'none',
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
})

globalStyle(`${root} [data-line]`, {
  borderLeft: '2px solid transparent',
  padding: `${spaceVars['0']} ${spaceVars['22']}`,
  lineHeight: lineHeightVars.code,
})
globalStyle(`${Callout} ${root} [data-line]`, {
  padding: `${spaceVars['0']} ${spaceVars['12']}`,
})
globalStyle(`${root} .twoslash-popup-info [data-line]`, {
  padding: `${spaceVars['0']} ${spaceVars['4']}`,
})
globalStyle(`${root} .twoslash-popup-info-hover [data-line]`, {
  display: 'inline-block',
  padding: `${spaceVars['0']} ${spaceVars['8']}`,
})
globalStyle(`${root} .twoslash-error-line, ${root} .twoslash-tag-line`, {
  padding: `${spaceVars['0']} ${spaceVars['22']}`,
})

globalStyle(`${root} [data-line-numbers]`, {
  counterReset: 'line',
})

globalStyle(`${root} [data-line-numbers] [data-line]`, {
  padding: `${spaceVars['0']} ${spaceVars['16']}`,
})

globalStyle(`${root} [data-line-numbers] [data-line]::before`, {
  color: semanticColorVars.lineNumber,
  content:'attr(data-line-number)',
  display: 'inline-block',
  fontSize: fontSizeVars.lineNumber,
  marginRight: spaceVars['16'],
  textAlign: 'right',
  width: '1rem',
  verticalAlign:'middle'
})

globalStyle(`${root} [data-highlighted-line], ${root} .highlighted`, {
  backgroundColor: semanticColorVars.codeHighlightBackground,
  borderLeft: `2px solid ${semanticColorVars.codeHighlightBorder}`,
  boxSizing: 'content-box',
})

globalStyle(`${root} [data-highlighted-chars], ${root} .highlighted-word`, {
  borderRadius: borderRadiusVars['2'],
  backgroundColor: `${semanticColorVars.codeCharacterHighlightBackground} !important`,
  boxShadow: `0 0 0 4px ${semanticColorVars.codeCharacterHighlightBackground}`,
})

globalStyle(`${root} .has-diff`, {
  position: 'relative',
})

globalStyle(`${root} [data-line].diff.add`, {
  backgroundColor: primitiveColorVars.backgroundGreenTint2,
})

globalStyle(`${root} [data-line].diff.remove`, {
  backgroundColor: primitiveColorVars.backgroundRedTint2,
  opacity: '0.6',
})

globalStyle(`${root} [data-line].diff.remove > span:not([data-diff-flag])`, {
  filter: 'grayscale(1)',
})

globalStyle(
  `${root} .has-focused > code > [data-line]:not(.focused), ${root} .has-focused > code > .twoslash-meta-line:not(.focused)`,
  {
    opacity: '0.3',
    transition: 'opacity 0.2s',
  },
)

globalStyle(
  `${root}:hover .has-focused [data-line]:not(.focused), ${root}:hover .has-focused .twoslash-meta-line:not(.focused)`,
  {
    opacity: '1',
    transition: 'opacity 0.2s',
  },
)

globalStyle(`${root} [data-line], ${root} .twoslash-error-line, ${root} .twoslash-tag-line`, {
  '@media': {
    [viewportVars['max-720px']]: {
      padding: `0 ${spaceVars['16']}`,
    },
  },
})

globalStyle(`${root} [data-line].diff::before`, {
  '@media': {
    [viewportVars['max-720px']]: {
      left: spaceVars['6'],
    },
  },
})

globalStyle(`${root} [data-line] [data-diff-flag]`, {
  display:'inline-block',
  width:'1em',
  marginRight: 'var(--vocs-space_12)'
})

globalStyle(`${root} .diff [data-diff-flag]::before`, {
  display: 'inline-block',
  fontSize: 'var(--vocs-fontSize_lineNumber)',
  width: '1em',
  verticalAlign: 'middle'
})

globalStyle(`${root} .diff.add [data-diff-flag]::before`, {
  content: '+',
  color: primitiveColorVars.textGreen,
})

globalStyle(`${root} .diff.remove [data-diff-flag]::before`, {
  content: '-',
  color: primitiveColorVars.textRed,
})

globalStyle(`[data-line-number] .twoslash-hover [data-line]::before`, {
  display:'none'
})
