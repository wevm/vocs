import { createGlobalTheme, createGlobalThemeContract, globalStyle } from '@vanilla-extract/css'
import { primitiveColorVars } from './vars.css.js'

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
  borderColor: primitiveColorVars.border,
  underlineColor: 'currentColor',
  popupBackground: primitiveColorVars.background2,
  popupShadow: 'rgba(0, 0, 0, 0.08) 0px 1px 4px',
  matchedColor: 'inherit',
  unmatchedColor: '#888',
  cursorColor: '#8888',
  errorColor: primitiveColorVars.textRed,
  errorBackground: primitiveColorVars.backgroundRedTint2,
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

globalStyle(
  '.twoslash-query-presisted > .twoslash-popup-info, .twoslash-query-presisted > .twoslash-popup-info-hover',
  {
    zIndex: 1,
  },
)

globalStyle(
  ':not(.twoslash-query-presisted) > .twoslash-popup-info, :not(.twoslash-query-presisted) > .twoslash-popup-info-hover',
  {
    zIndex: 2,
  },
)

globalStyle('.twoslash:hover .twoslash-hover', {
  borderColor: twoslashVars.underlineColor,
})

globalStyle('.twoslash .twoslash-hover', {
  borderBottom: '1px dotted transparent',
  transitionTimingFunction: 'ease',
  transition: 'border-color 0.3s',
})

globalStyle('.twoslash-query-presisted', {
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
  maxWidth: '500px',
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
  padding: '4px 0px',
  pointerEvents: 'none',
  position: 'fixed',
  opacity: 0,
  transition: 'opacity 0.3s',
  whiteSpace: 'pre-wrap',
  userSelect: 'none',
})

globalStyle('.twoslash .twoslash-popup-scroll-container', {
  maxHeight: '300px',
  overflowY: 'scroll',
  msOverflowStyle: 'none',
  scrollbarWidth: 'none',
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

globalStyle('.twoslash-query-presisted .twoslash-popup-info', {
  zIndex: 9,
  transform: 'translateY(1.5em)',
})

globalStyle(
  '.twoslash-hover:hover .twoslash-popup-info, .twoslash-query-presisted .twoslash-popup-info',
  {
    opacity: 1,
    pointerEvents: 'auto',
  },
)
globalStyle('.twoslash-popup-info-hover[data-show]', {
  opacity: 1,
  pointerEvents: 'auto',
  zIndex: 20,
})

globalStyle('.twoslash-popup-info:hover, .twoslash-popup-info-hover:hover', {
  userSelect: 'auto',
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

globalStyle('.twoslash-completions-list', {
  position: 'relative',
})

globalStyle('.twoslash-completions-list ul', {
  userSelect: 'none',
  position: 'absolute',
  top: '0',
  left: '0',
  transform: 'translate(0, 1.2em)',
  width: '240px',
  background: twoslashVars.popupBackground,
  border: `1px solid ${twoslashVars.borderColor}`,
  fontSize: '0.8rem',
  margin: '3px 0 0 -1px',
  padding: '4px',
  zIndex: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  boxShadow: twoslashVars.popupShadow,
})

globalStyle('.twoslash-completions-list ul:hover', {
  userSelect: 'auto',
})

globalStyle('.twoslash-completions-list ul::before', {
  backgroundColor: twoslashVars.cursorColor,
  width: '2px',
  position: 'absolute',
  top: '-1.6em',
  height: '1.4em',
  left: '-1px',
  content: ' ',
})

globalStyle('.twoslash-completions-list ul li', {
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  gap: '0.25em',
  lineHeight: '1em',
})

globalStyle('.twoslash-completions-list ul li span.twoslash-completions-unmatched', {
  color: `${twoslashVars.unmatchedColor} !important`,
})

globalStyle('.twoslash-completions-list ul .deprecated', {
  textDecoration: 'line-through',
  opacity: '0.5',
})

globalStyle('.twoslash-completions-list ul li span.twoslash-completions-matched', {
  color: twoslashVars.matchedColor,
})

globalStyle('.twoslash-completions-list .twoslash-completions-icon', {
  color: twoslashVars.unmatchedColor,
  width: '1em',
  flex: 'none',
})

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
