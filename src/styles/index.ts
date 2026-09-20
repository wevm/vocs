import { theme } from 'zyzz/default'
import { global } from 'zyzz/web'

global({
  '@layer vocs_base': {
    ':root': {
      backgroundColor: theme.vars.color.background['200'],
      letterSpacing: '0.005em',
      color: theme.vars.color.foreground,
      colorScheme: 'light dark',
      '@media (width < 48rem)': { backgroundColor: theme.vars.color.surface },
      fontFeatureSettings: '"rlig" 1, "calt" 1',
      textRendering: 'optimizeLegibility',
      fontFamily: theme.vars.fontFamily.sans,
      '--vocs-layout-banner': '0px',
      '--vocs-layout-code-block-px': '1.5rem',
      '--vocs-layout-content-px': '3rem',
      '--vocs-layout-content-py': '2.5rem',
      '--vocs-layout-content': 'calc(70ch + (var(--vocs-layout-content-px) * 2))',
      '--vocs-layout-outline': '280px',
      '--vocs-layout-logo':
        'max(calc((100vw - var(--vocs-layout-content)) / 2), var(--vocs-layout-sidebar))',
      '--vocs-layout-gutter':
        'max(calc((100vw - var(--vocs-layout-content)) / 2), var(--vocs-layout-sidebar))',
      '--vocs-layout-sidebar-px': '1.5rem',
      '--vocs-layout-sidebar-py': '0rem',
      '--vocs-layout-sidebar': '300px',
      '--vocs-layout-topNav-px': 'var(--vocs-layout-content-px)',
      '--vocs-layout-topNav': '56px',
    },
    ':root[data-vocs-theme="light"]': {
      '--lightningcss-light': 'initial',
      '--lightningcss-dark': ' ',
      colorScheme: 'light',
    },
    ':root[data-vocs-theme="dark"]': {
      '--lightningcss-light': ' ',
      '--lightningcss-dark': 'initial',
      colorScheme: 'dark',
    },
    html: {
      scrollPaddingTop: 'calc(var(--vocs-layout-topNav) + var(--vocs-layout-banner) + 1rem)',
    },
    '[data-v-gutter-logo]': { top: 'var(--vocs-layout-banner)' },
    '[data-v-gutter-left]': {
      paddingTop: 'calc(var(--vocs-layout-topNav) + var(--vocs-layout-banner))',
    },
    '[data-v-gutter-top]': {
      top: 'var(--vocs-layout-banner)',
      zIndex: 20,
      left: '0',
      width: '100%',
      paddingRight: '1rem',
    },
    '[data-v-sidebar] > [data-v-gutter-top]': {
      zIndex: 20,
      '@media (width >= 64rem)': {
        left: 'var(--vocs-layout-gutter)',
        width: 'calc(100vw - var(--vocs-layout-gutter))',
        paddingRight:
          'calc(var(--vocs-layout-gutter) - var(--vocs-layout-sidebar) - (0.25rem * 4))',
      },
    },
    '[data-v-gutter-top-left]': { marginLeft: '0.5rem' },
    '[data-v-sidebar] > [data-v-gutter-top] [data-v-gutter-top-left]': {
      '@media (width >= 64rem)': { marginLeft: '-1.75rem' },
    },
    '[data-v-sidebar] [data-v-logo-link]': {
      '@media (width >= 64rem)': { display: 'none !important' },
    },
    '[data-v-surface-bg]': { top: 'calc(var(--vocs-layout-topNav) + var(--vocs-layout-banner))' },
    '[data-v-topnav] > [data-v-surface-bg]': {
      '@media (width >= 64rem)': { borderTopLeftRadius: '1rem' },
    },
    '[data-v-gutter-right]': { top: 'calc(var(--vocs-layout-topNav) + var(--vocs-layout-banner))' },
    '[data-v-main]': { paddingTop: 'calc(var(--vocs-layout-topNav) + var(--vocs-layout-banner))' },
    '[data-v-sidebar] > [data-v-main]': {
      '@media (width >= 64rem)': { marginLeft: 'var(--vocs-layout-gutter)' },
    },
    '[data-layout="blank"] > [data-v-main]': { paddingTop: '0' },
    '[data-v-content], [data-v-footer]': { marginLeft: 'auto', marginRight: 'auto' },
    '[data-v-sidebar] [data-v-content], [data-v-sidebar] [data-v-footer]': {
      '@media (width >= 64rem)': { marginLeft: 'unset', marginRight: 'unset' },
    },
    '[data-v-content-width="full"]': {
      '@media (width >= 64rem)': {
        '--vocs-layout-gutter': 'var(--vocs-layout-sidebar)',
        '--vocs-layout-logo': 'var(--vocs-layout-sidebar)',
      },
    },
    '[data-layout="minimal"] > [data-v-main], [data-layout="blank"] > [data-v-main]': {
      position: 'relative',
      zIndex: 10,
    },
    '[data-layout="minimal"] > [data-v-gutter-top], [data-layout="blank"] > [data-v-gutter-top]': {
      zIndex: 20,
    },
    '[data-layout="minimal"] [data-v-content], [data-layout="blank"] [data-v-content]': {
      backgroundColor: theme.vars.color.surface,
    },
    '[data-layout]:not([data-v-topnav]) > [data-v-main]': { paddingTop: '0' },
    '[data-layout]:not([data-v-topnav]) > [data-v-gutter-left]': {
      paddingTop: 'var(--vocs-layout-topNav)',
    },
    '[data-layout]:not([data-v-topnav]) > [data-v-surface-bg]': { top: '0' },
    '[data-layout]:not([data-v-topnav]) > [data-v-gutter-right]': { top: '0' },
    body: { position: 'relative', '@media (width < 48rem)': { overflowX: 'hidden' } },
    '*:focus': { outlineStyle: 'none' },
    '*:focus-visible': {
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineOffset: '2px',
      outlineColor: theme.vars.color.blue['700'],
    },
    '*': {
      scrollbarWidth: 'thin',
      scrollbarColor: `light-dark(${theme.vars.color.gray['600']}, ${theme.vars.color.gray['600']}) transparent`,
    },
    '@media (width < 64rem)': {
      ':root': {
        '--vocs-layout-gutter': '0px',
        '--vocs-layout-content-px': '1.5rem',
        '--vocs-layout-content-py': '3rem',
        '--vocs-layout-sidebar-px': '1rem',
        '--vocs-layout-sidebar-py': '1rem',
        '--vocs-layout-topNav': '48px',
      },
    },
    '@media (width < 48rem)': {
      ':root': {
        '--vocs-layout-code-block-px': '1rem',
        '--vocs-layout-content-px': '1rem',
        '--vocs-layout-content-py': '2rem',
      },
    },
  },
  '@layer properties': {
    '@supports ((-webkit-hyphens: none) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color:rgb(from red r g b))))':
      { '*, ::before, ::after, ::backdrop': {} },
  },
})
