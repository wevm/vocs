import type * as VocsConfig from '../../../internal/config.js'

export type RouteRender = 'static' | 'dynamic'

export function getDefaultRouteRender(
  renderStrategy: VocsConfig.Config['renderStrategy'],
): RouteRender {
  return renderStrategy === 'dynamic' ? 'dynamic' : 'static'
}
