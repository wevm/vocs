import { globalStyle } from '@vanilla-extract/css'

globalStyle(':root', {
  vars: {
    '--color-note': '#0969da',
    '--color-tip': '#1a7f37',
    '--color-warning': '#9a6700',
    '--color-severe': '#bc4c00',
    '--color-caution': '#d1242f',
    '--color-important': '#8250df',
  },
})

globalStyle(':root.dark', {
  vars: {
    '--color-note': '#2f81f7',
    '--color-tip': '#3fb950',
    '--color-warning': '#d29922',
    '--color-severe': '#db6d28',
    '--color-caution': '#f85149',
    '--color-important': '#a371f7',
  },
})

globalStyle('.markdown-alert', {
  padding: '0.5rem 1rem',
  marginBottom: '16px',
  color: 'inherit',
  borderLeft: '0.25em solid #888',
})

globalStyle('.markdown-alert > :first-child', {
  marginTop: 0,
})

globalStyle('.markdown-alert > :last-child', {
  marginBottom: 0,
})

globalStyle('.markdown-alert .markdown-alert-title', {
  display: 'flex',
  fontWeight: 500,
  alignItems: 'center',
  lineHeight: 1,
})

globalStyle('.markdown-alert .markdown-alert-title .octicon', {
  marginRight: '0.5rem',
  overflow: 'visible !important',
  WebkitMask: 'var(--oct-icon) no-repeat',
  mask: 'var(--oct-icon) no-repeat',
  WebkitMaskSize: '100% 100%',
  maskSize: '100% 100%',
  backgroundColor: 'currentColor',
  color: 'inherit',
  display: 'inline-block',
  verticalAlign: 'text-bottom',
  width: '1em',
  height: '1em',
})

globalStyle('div.markdown-alert .markdown-alert-title + *', {
  marginTop: '0.5rem',
})

globalStyle('.markdown-alert.markdown-alert-note', {
  borderLeftColor: 'var(--color-note)',
})
globalStyle('.markdown-alert.markdown-alert-note .markdown-alert-title', {
  color: 'var(--color-note)',
})

globalStyle('.markdown-alert.markdown-alert-important', {
  borderLeftColor: 'var(--color-important)',
})
globalStyle('.markdown-alert.markdown-alert-important .markdown-alert-title', {
  color: 'var(--color-important)',
})

globalStyle('.markdown-alert.markdown-alert-severe', {
  borderLeftColor: 'var(--color-severe)',
})
globalStyle('.markdown-alert.markdown-alert-severe .markdown-alert-title', {
  color: 'var(--color-severe)',
})

globalStyle('.markdown-alert.markdown-alert-tip', {
  borderLeftColor: 'var(--color-tip)',
})
globalStyle('.markdown-alert.markdown-alert-tip .markdown-alert-title', {
  color: 'var(--color-tip)',
})

globalStyle('.markdown-alert.markdown-alert-warning', {
  borderLeftColor: 'var(--color-warning)',
})
globalStyle('.markdown-alert.markdown-alert-warning .markdown-alert-title', {
  color: 'var(--color-warning)',
})
