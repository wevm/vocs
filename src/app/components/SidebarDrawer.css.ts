import { keyframes, style } from '@vanilla-extract/css'
import { sidebarVars, viewportVars, zIndexVars } from '../styles/vars.css.js'

const expand = keyframes(
  {
    from: {
      left: `calc(-1 * ${sidebarVars.width})`,
    },
    to: {
      left: 0,
    },
  },
  'expand',
)

const fadeIn = keyframes(
  {
    from: {
      opacity: 0,
    },
    to: {
      opacity: 1,
    },
  },
  'fadeIn',
)

export const root = style({
  display: 'none',
  top: 0,
  left: 0,
  position: 'fixed',
  width: sidebarVars.width,
  height: '100vh',
  zIndex: zIndexVars.drawer,
  animation: `${expand} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
  '@media': {
    [viewportVars['max-1080px']]: {
      display: 'initial',
    },
  },
})

export const backdrop = style(
  {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'fixed',
    inset: 0,
    zIndex: zIndexVars.backdrop,
    animation: `${fadeIn} 150ms cubic-bezier(0.16, 1, 0.3, 1)`,
    '@media': {
      [viewportVars['max-1080px']]: {
        display: 'initial',
      },
    },
  },
  'backdrop',
)
