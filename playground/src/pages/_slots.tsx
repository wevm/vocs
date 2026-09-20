import { style, theme } from 'zyzz/default'

namespace styles {
  export const footer = style({
    paddingTop: 6,
    textAlign: 'center',
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    color: theme.vars.color.gray['900'],
  })
  export const outlineFooter = style({
    fontSize: 'xs',
    lineHeight: 'calc(1 / 0.75)',
    color: theme.vars.color.gray['900'],
  })
  export const outlineFooter2 = style({
    color: theme.vars.color.blue['700'],
    selectors: { '&:hover': { '@media (hover: hover)': { textDecorationLine: 'underline' } } },
  })
}

export function Footer() {
  return <div {...styles.footer()}>© 2025 My Project. All rights reserved.</div>
}

export function OutlineFooter() {
  return (
    <div {...styles.outlineFooter()}>
      Need help?{' '}
      <a {...styles.outlineFooter2()} href="https://discord.gg/example">
        Join our Discord
      </a>
    </div>
  )
}
