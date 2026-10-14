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

// React DOM server keeps the last render's context values after top-level work,
// which holds that whole page in dev. Release them once the request has no tasks left.
export function patchReactDomServerPlugin(): Plugin {
  const search =
    /prevDispatcher === HooksDispatcher && switchContext\(prevContext\),(\s*)\(?currentRequest = prevRequest\)?;/g
  return {
    name: 'vocs:patch-react-dom-server',
    enforce: 'pre',
    transform(code, id) {
      if (!/[/\\]react-dom-server[^/\\]*\.development[^/\\]*\.js$/.test(id.split('?')[0] ?? ''))
        return
      const patched = code.replace(
        search,
        '(prevDispatcher === HooksDispatcher ? switchContext(prevContext) : null !== currentRequest && 0 === currentRequest.allPendingTasks && switchContext(null)),$1currentRequest = prevRequest;',
      )
      if (patched !== code) return patched
      return
    },
  }
}
