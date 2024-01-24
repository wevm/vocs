import { createGlobalTheme, createGlobalThemeContract, globalStyle } from '@vanilla-extract/css'
import { borderRadiusVars, primitiveColorVars, semanticColorVars } from './vars.css.js'

const getVarName = (scope: string) => (_: string | null, path: string[]) =>
  `vocs-${scope}_${path.join('-')}`

export const twoslashVars = createGlobalThemeContract(
  {
    borderColor: 'borderColor',
    underlineColor: 'underlineColor',
    popupBackground: 'popupBackground',
    popupShadow: 'popupShadow',
    matchedColor: 'matchedColor',
    unmatchedColor: 'unmatchedColor',
    cursorColor: 'cursorColor',
    errorColor: 'errorColor',
    errorBackground: 'errorBackground',
    highlightedBackground: 'highlightedBackground',
    highlightedBorder: 'highlightedBorder',
    tagColor: 'tagColor',
    tagBackground: 'tagBackground',
    tagWarnColor: 'tagWarnColor',
    tagWarnBackground: 'tagWarnBackground',
    tagAnnotateColor: 'tagAnnotateColor',
    tagAnnotateBackground: 'tagAnnotateBackground',
  },
  getVarName('twoslash'),
)

createGlobalTheme(':root', twoslashVars, {
  borderColor: primitiveColorVars.border2,
  underlineColor: 'currentColor',
  popupBackground: primitiveColorVars.background2,
  popupShadow: 'rgba(0, 0, 0, 0.08) 0px 1px 4px',
  matchedColor: 'inherit',
  unmatchedColor: '#888',
  cursorColor: '#8888',
  errorColor: primitiveColorVars.textRed,
  errorBackground: primitiveColorVars.backgroundRedTint2,
  highlightedBackground: primitiveColorVars.background,
  highlightedBorder: primitiveColorVars.background,
  tagColor: primitiveColorVars.textBlue,
  tagBackground: primitiveColorVars.backgroundBlueTint,
  tagWarnColor: primitiveColorVars.textYellow,
  tagWarnBackground: primitiveColorVars.backgroundYellowTint,
  tagAnnotateColor: primitiveColorVars.textGreen,
  tagAnnotateBackground: primitiveColorVars.backgroundGreenTint2,
})
createGlobalTheme(':root.dark', twoslashVars, {
  borderColor: primitiveColorVars.border2,
  underlineColor: 'currentColor',
  popupBackground: primitiveColorVars.background5,
  popupShadow: 'rgba(0, 0, 0, 0.08) 0px 1px 4px',
  matchedColor: 'inherit',
  unmatchedColor: '#888',
  cursorColor: '#8888',
  errorColor: primitiveColorVars.textRed,
  errorBackground: primitiveColorVars.backgroundRedTint2,
  highlightedBackground: primitiveColorVars.background,
  highlightedBorder: primitiveColorVars.background,
  tagColor: primitiveColorVars.textBlue,
  tagBackground: primitiveColorVars.backgroundBlueTint,
  tagWarnColor: primitiveColorVars.textYellow,
  tagWarnBackground: primitiveColorVars.backgroundYellowTint,
  tagAnnotateColor: primitiveColorVars.textGreen,
  tagAnnotateBackground: primitiveColorVars.backgroundGreenTint2,
})

/* Respect people's wishes to not have animations */
globalStyle('.twoslash *', {
  '@media': {
    '(prefers-reduced-motion: reduce)': {
      transition: 'none !important',
    },
  },
})

globalStyle(':root .twoslash-popup-info-hover, :root .twoslash-popup-info', {
  vars: {
    '--shiki-light-bg': primitiveColorVars.background2,
  },
})
globalStyle(':root .twoslash-popup-info', {
  width: 'max-content',
})

globalStyle(':root.dark .twoslash-popup-info, :root.dark .twoslash-popup-info-hover', {
  vars: {
    '--shiki-dark-bg': primitiveColorVars.background5,
  },
})

globalStyle('.twoslash-query-persisted > .twoslash-popup-info', {
  zIndex: 1,
})

globalStyle(':not(.twoslash-query-persisted) > .twoslash-popup-info', {
  zIndex: 2,
})

globalStyle('.twoslash:hover .twoslash-hover', {
  borderColor: twoslashVars.underlineColor,
})

globalStyle('.twoslash .twoslash-hover', {
  borderBottom: '1px dotted transparent',
  transitionTimingFunction: 'ease',
  transition: 'border-color 0.3s',
})

globalStyle('.twoslash-query-persisted', {
  position: 'relative',
})

globalStyle('.twoslash .twoslash-popup-info', {
  position: 'absolute',
  top: '0',
  left: '0',
  opacity: '0',
  display: 'inline-block',
  transform: 'translateY(1.1em)',
  background: twoslashVars.popupBackground,
  border: `1px solid ${twoslashVars.borderColor}`,
  transition: 'opacity 0.3s',
  borderRadius: '4px',
  maxWidth: '540px',
  padding: '4px 6px',
  pointerEvents: 'none',
  textAlign: 'left',
  zIndex: 20,
  whiteSpace: 'pre-wrap',
  userSelect: 'none',
  boxShadow: twoslashVars.popupShadow,
})

globalStyle('.twoslash .twoslash-popup-info-hover', {
  background: twoslashVars.popupBackground,
  border: `1px solid ${twoslashVars.borderColor}`,
  borderRadius: '4px',
  boxShadow: twoslashVars.popupShadow,
  display: 'inline-block',
  maxWidth: '500px',
  pointerEvents: 'auto',
  position: 'fixed',
  opacity: 1,
  transition: 'opacity 0.3s',
  whiteSpace: 'pre-wrap',
  userSelect: 'none',
  zIndex: 20,
})

globalStyle('.twoslash .twoslash-popup-scroll-container', {
  maxHeight: '300px',
  padding: '4px 0px',
  overflowY: 'auto',
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
})

globalStyle('.twoslash-popup-arrow', {
  position: 'absolute',
  top: '-4px',
  left: '1em',
  borderTop: `1px solid ${twoslashVars.borderColor}`,
  borderRight: `1px solid ${twoslashVars.borderColor}`,
  background: twoslashVars.popupBackground,
  transform: 'rotate(-45deg)',
  width: '6px',
  height: '6px',
  pointerEvents: 'none',
})

globalStyle('.twoslash .twoslash-popup-scroll-container::-webkit-scrollbar', {
  display: 'none',
})

globalStyle('.twoslash .twoslash-popup-jsdoc', {
  borderTop: `1px solid ${primitiveColorVars.border2}`,
  color: primitiveColorVars.text,
  fontFamily: 'sans-serif',
  fontWeight: '500',
  marginTop: '4px',
  padding: '4px 10px 0px 10px',
})

globalStyle('.twoslash-tag-line + .twoslash-tag-line', {
  marginTop: '-0.2em',
})

globalStyle('.twoslash-query-persisted .twoslash-popup-info', {
  zIndex: 9,
  transform: 'translateY(1.5em)',
})

globalStyle(
  '.twoslash-hover:hover .twoslash-popup-info, .twoslash-query-persisted .twoslash-popup-info',
  {
    opacity: 1,
    pointerEvents: 'auto',
  },
)

globalStyle('.twoslash-popup-info:hover, .twoslash-popup-info-hover:hover', {
  userSelect: 'auto',
})

globalStyle('.twoslash-error-line', {
  position: 'relative',
  backgroundColor: twoslashVars.errorBackground,
  borderLeft: `2px solid ${twoslashVars.errorColor}`,
  color: twoslashVars.errorColor,
  margin: '0.2em 0',
})

globalStyle('.twoslash-error', {
  background: `url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%206%203'%20enable-background%3D'new%200%200%206%203'%20height%3D'3'%20width%3D'6'%3E%3Cg%20fill%3D'%23c94824'%3E%3Cpolygon%20points%3D'5.5%2C0%202.5%2C3%201.1%2C3%204.1%2C0'%2F%3E%3Cpolygon%20points%3D'4%2C0%206%2C2%206%2C0.6%205.4%2C0'%2F%3E%3Cpolygon%20points%3D'0%2C2%201%2C3%202.4%2C3%200%2C0.6'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E") repeat-x bottom left`,
  paddingBottom: '2px',
})

globalStyle('.twoslash-completion-cursor', {
  position: 'relative',
})

globalStyle('.twoslash-completion-cursor .twoslash-completion-list', {
  userSelect: 'none',
  position: 'absolute',
  top: '0',
  left: '0',
  transform: 'translate(0, 1.2em)',
  margin: '3px 0 0 -1px',
  zIndex: 8,
  boxShadow: twoslashVars.popupShadow,
  background: twoslashVars.popupBackground,
  border: `1px solid ${twoslashVars.borderColor}`,
})

globalStyle('.twoslash-completion-list', {
  borderRadius: '4px',
  fontSize: '0.8rem',
  padding: '4px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  width: '240px',
})

globalStyle('.twoslash-completion-list:hover', {
  userSelect: 'auto',
})

globalStyle('.twoslash-completion-list::before', {
  backgroundColor: twoslashVars.cursorColor,
  width: '2px',
  position: 'absolute',
  top: '-1.6em',
  height: '1.4em',
  left: '-1px',
  content: ' ',
})

globalStyle('.twoslash-completion-list .twoslash-completion-list-item', {
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5em',
  lineHeight: '1em',
})

globalStyle(
  '.twoslash-completion-list .twoslash-completion-list-item span.twoslash-completions-unmatched.twoslash-completions-unmatched.twoslash-completions-unmatched',
  {
    color: `${twoslashVars.unmatchedColor} !important`,
  },
)

globalStyle('.twoslash-completion-list .deprecated', {
  textDecoration: 'line-through',
  opacity: 0.5,
})

globalStyle(
  '.twoslash-completion-list .twoslash-completion-list-item span.twoslash-completions-matched.twoslash-completions-unmatched.twoslash-completions-unmatched',
  {
    color: `${twoslashVars.matchedColor} !important`,
  },
)

globalStyle('.twoslash-tag-line', {
  position: 'relative',
  backgroundColor: twoslashVars.tagBackground,
  borderLeft: `2px solid ${twoslashVars.tagColor}`,
  color: twoslashVars.tagColor,
  margin: '0.2em 0',
  display: 'flex',
  alignItems: 'center',
  gap: '0.3em',
})

globalStyle('.twoslash-tag-line+.line[data-empty-line]+.twoslash-tag-line', {
  marginTop: 'calc(-1.75em - 0.2em)',
})

globalStyle('.twoslash-tag-line .twoslash-tag-icon', {
  width: '1.1em',
  color: 'inherit',
})

globalStyle('.twoslash-tag-line.twoslash-tag-error-line', {
  backgroundColor: twoslashVars.errorBackground,
  borderLeft: `2px solid ${twoslashVars.errorColor}`,
  color: twoslashVars.errorColor,
})

globalStyle('.twoslash-tag-line.twoslash-tag-warn-line', {
  backgroundColor: twoslashVars.tagWarnBackground,
  borderLeft: `2px solid ${twoslashVars.tagWarnColor}`,
  color: twoslashVars.tagWarnColor,
})

globalStyle('.twoslash-tag-line.twoslash-tag-annotate-line', {
  backgroundColor: twoslashVars.tagAnnotateBackground,
  borderLeft: `2px solid ${twoslashVars.tagAnnotateColor}`,
  color: twoslashVars.tagAnnotateColor,
})

globalStyle('.twoslash-highlighted', {
  borderRadius: borderRadiusVars['2'],
  backgroundColor: `${semanticColorVars.codeCharacterHighlightBackground} !important`,
  boxShadow: `0 0 0 4px ${semanticColorVars.codeCharacterHighlightBackground}`,
})
