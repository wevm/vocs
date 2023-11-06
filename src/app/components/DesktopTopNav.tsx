import { curtain, root } from './DesktopTopNav.css.js'

DesktopTopNav.Curtain = Curtain

export function DesktopTopNav() {
  return <div className={root} />
}

export function Curtain() {
  return <div className={curtain} />
}
