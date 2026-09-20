import { theme } from 'zyzz/default'
import { global } from 'zyzz/web'

global({
  '.scalar-app[data-v-openapi-playground-root], .scalar-app[data-v-openapi-playground-root] .light-mode, .scalar-app[data-v-openapi-playground-root] .dark-mode':
    {
      '--scalar-background-1': theme.vars.color.surface,
      '--scalar-background-2': theme.vars.color.gray[100],
      '--scalar-background-3': theme.vars.color.gray[200],
      '--scalar-background-4': theme.vars.color.gray[300],
      '--scalar-background-accent': theme.vars.color.blue['300'],
      '--scalar-color-1': theme.vars.color.foreground,
      '--scalar-color-2': theme.vars.color.gray['900'],
      '--scalar-color-3': theme.vars.color.gray['800'],
      '--scalar-color-accent': theme.vars.color.blue['700'],
      '--scalar-border-color': theme.vars.color.gray['400'],
      '--scalar-link-color': theme.vars.color.foreground,
      '--scalar-link-color-hover': theme.vars.color.gray['900'],
      '--scalar-link-color-visited': theme.vars.color.foreground,
      '--scalar-color-red': theme.vars.color.red['900'],
      '--scalar-color-danger': theme.vars.color.red['900'],
      '--scalar-color-green': theme.vars.color.green['900'],
      '--scalar-color-blue': theme.vars.color.blue['900'],
      '--scalar-color-yellow': theme.vars.color.amber['900'],
      '--scalar-color-orange': theme.vars.color.amber['900'],
      '--scalar-color-alert': theme.vars.color.amber['900'],
      '--scalar-color-purple': theme.vars.color.purple['900'],
      '--scalar-background-danger': theme.vars.color.red['100'],
      '--scalar-button-1': theme.vars.color.foreground,
      '--scalar-button-1-color': theme.vars.color.surface,
      '--scalar-button-1-hover': theme.vars.color.foreground,
      '--scalar-sidebar-background-1': theme.vars.color.surface,
      '--scalar-sidebar-color-1': theme.vars.color.foreground,
      '--scalar-sidebar-color-2': theme.vars.color.gray['900'],
      '--scalar-sidebar-border-color': theme.vars.color.gray['400'],
      '--scalar-sidebar-item-hover-background': theme.vars.color.background['200'],
      '--scalar-sidebar-item-active-background': theme.vars.color.background['200'],
      '--scalar-sidebar-color-active': theme.vars.color.blue['700'],
      '--scalar-sidebar-search-background': theme.vars.color.background['200'],
      '--scalar-sidebar-search-border-color': theme.vars.color.gray['400'],
      '--scalar-sidebar-search-color': theme.vars.color.gray['800'],
      '--scalar-font': theme.vars.fontFamily.sans,
      '--scalar-font-code': theme.vars.fontFamily.mono,
    },
  '.scalar-app input[type="checkbox"].peer:not(:checked) ~ div .scalar-icon, .scalar-app input[type="checkbox"].peer:not(:checked) ~ div svg':
    { color: 'transparent' },
  '.scalar-app[data-v-openapi-playground-root] tr:has(input[type="checkbox"].peer:not(:checked)) > td:nth-child(3) :is(.code-input-lite__editor, [data-testid="code-input-lite-disabled"], .text-c-1)':
    { color: 'var(--scalar-color-3)' },
})
