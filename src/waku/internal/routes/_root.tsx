import { config } from 'virtual:vocs/config'

export { Root as default } from '../../../react/Root.js'

export const getConfig = async () => {
  const { renderStrategy } = config
  return {
    render: renderStrategy === 'dynamic' ? 'dynamic' : 'static',
  } as const
}
