import { config } from 'virtual:vocs/config'

export { Root as default } from '../../../react/Root.js'

export const getConfig = async () => {
  const { renderStrategy } = config
  return {
    render: import.meta.env.DEV ? 'static' : renderStrategy === 'dynamic' ? 'dynamic' : 'static',
  } as const
}
