import { globalStyle } from '@vanilla-extract/css'

import { twoslashVars } from './twoslash.css.js'

globalStyle('.tag-line', {
  position: 'relative',
  margin: '0.2em 0',
  display: 'flex',
  alignItems: 'center',
  gap: '0.3em',
})

globalStyle('.tag-line + .tag-line', {
  marginTop: '-0.2em',
})

globalStyle('.tag-line+.line[data-empty-line]+.tag-line', {
  marginTop: 'calc(-1.75em - 0.2em)',
})

globalStyle('.tag-line.tag-error-line', {
  backgroundColor: twoslashVars.errorBackground,
  borderLeft: `2px solid ${twoslashVars.errorColor} !important`,
  color: twoslashVars.errorColor,
})

globalStyle('.tag-line.tag-log-line', {
  backgroundColor: twoslashVars.tagBackground,
  borderLeft: `2px solid ${twoslashVars.tagColor} !important`,
  color: twoslashVars.tagColor,
})

globalStyle('.tag-line.tag-warn-line', {
  backgroundColor: twoslashVars.tagWarnBackground,
  borderLeft: `2px solid ${twoslashVars.tagWarnColor} !important`,
  color: twoslashVars.tagWarnColor,
})

globalStyle('.tag-line.tag-annotate-line', {
  backgroundColor: twoslashVars.tagAnnotateBackground,
  borderLeft: `2px solid ${twoslashVars.tagAnnotateColor} !important`,
  color: twoslashVars.tagAnnotateColor,
})
