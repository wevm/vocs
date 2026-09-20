import type { Plugin } from 'vite'

// Waku RC.1 requires this patch but does not export it from waku/vite-plugins.
// https://github.com/wakujs/waku/issues/2281
export function patchReactDomPlugin(): Plugin {
  const search = '(hoistableRoot = resource.state.preload) &&'
  return {
    name: 'waku:vite-plugins:patch-react-dom',
    enforce: 'pre',
    transform(code, id) {
      if (
        !/[/\\](?:react-dom-client\.(?:development|production)|react-dom_client)\.js$/.test(
          id.split('?')[0] ?? '',
        )
      )
        return
      const patched = code.replace(search, `${search} hoistableRoot.isConnected &&`)
      if (patched !== code) return patched
      return
    },
  }
}
