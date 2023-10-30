import { globalStyle, style } from '@vanilla-extract/css'
import {
  borderRadiusVars,
  fontSizeVars,
  lineHeightVars,
  semanticColorVars,
  spaceVars,
} from '../../styles/vars.css.js'

export const root = style({})

globalStyle(`${root} code`, {
  fontSize: fontSizeVars.codeBlock,
})

globalStyle(`${root} pre`, {
  backgroundColor: semanticColorVars.codeBlockBackground,
  borderRadius: borderRadiusVars['4'],
  overflowX: 'scroll',
  padding: `${spaceVars['20']} ${spaceVars['0']}`,
  position: 'relative',
})

globalStyle(`${root} [data-rehype-pretty-code-title]+pre`, {
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
})

globalStyle(`${root} [data-line]`, {
  borderLeft: '2px solid transparent',
  padding: `${spaceVars['0']} ${spaceVars['22']}`,
  lineHeight: lineHeightVars.code,
})

globalStyle(`${root} [data-line-numbers]`, {
  counterReset: 'line',
})

globalStyle(`${root} [data-line-numbers] [data-line]`, {
  padding: `${spaceVars['0']} ${spaceVars['16']}`,
})

globalStyle(`${root} [data-line-numbers] [data-line]::before`, {
  color: semanticColorVars.lineNumber,
  content: 'counter(line)',
  counterIncrement: 'line',
  display: 'inline-block',
  fontSize: fontSizeVars.lineNumber,
  marginRight: spaceVars['16'],
  textAlign: 'right',
  width: '1rem',
})

globalStyle(`${root} [data-highlighted-line], ${root} .has-highlight`, {
  backgroundColor: semanticColorVars.codeHighlightBackground,
  borderLeft: `2px solid ${semanticColorVars.codeHighlightBorder}`,
  boxSizing: 'content-box',
})

globalStyle(`${root} [data-highlighted-chars]`, {
  borderRadius: borderRadiusVars['2'],
  backgroundColor: semanticColorVars.codeHighlightBackground,
  boxShadow: `0 0 0 4px ${semanticColorVars.codeHighlightBackground}`,
})

globalStyle(`${root} .has-diff`, {
  position: 'relative',
})

globalStyle(`${root} [data-line].diff::before`, {
  position: 'absolute',
  left: '10px',
})

globalStyle(`${root} [data-line].diff.add`, {
  backgroundColor: 'rgb(16 185 129 / 16%)',
})

globalStyle(`${root} [data-line].diff.add::before`, {
  content: '+',
  color: '#3dd68c',
})

globalStyle(`${root} [data-line].diff.remove`, {
  backgroundColor: 'rgb(244 63 94 / 16%)',
  opacity: '0.6',
})

globalStyle(`${root} [data-line].diff.remove > span`, {
  filter: 'grayscale(1)',
})

globalStyle(`${root} [data-line].diff.remove::before`, {
  content: '-',
  color: '#f66f81',
})

globalStyle(`${root} .has-focused-lines [data-line]:not(.has-focus)`, {
  filter: 'grayscale(1)',
  opacity: '0.3',
  transition: 'filter 0.2s, opacity 0.2s',
})

globalStyle(`${root}:hover .has-focused-lines [data-line]:not(.has-focus)`, {
  filter: 'grayscale(0)',
  opacity: '1',
  transition: 'filter 0.2s, opacity 0.2s',
})
