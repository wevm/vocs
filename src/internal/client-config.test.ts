import ruby from 'shiki/langs/ruby.mjs'
import type { Plugin } from 'vite'
import { describe, expect, test, vi } from 'vitest'
import * as ClientConfig from './client-config.js'
import * as Config from './config.js'
import * as ConfigSerializer from './config-serializer.js'
import { virtualConfig } from './vite-plugins.js'

function fixture() {
  return Config.define({
    codeHighlight: { langs: ruby, langAlias: { rb: 'ruby' } },
    head: (path) => ({ title: path === '/' ? 'Home' : 'Docs' }),
    markdown: { remarkPlugins: [() => () => {}] },
    twoslash: { checkOnly: true },
  })
}

describe('client configuration', () => {
  test('retains runtime settings without copying build-time plugins or grammars', () => {
    const config = fixture()
    const client = ClientConfig.from(config)
    expect(client.codeHighlight).toEqual({
      langAlias: config.codeHighlight.langAlias,
      themes: config.codeHighlight.themes,
    })
    expect(client).not.toHaveProperty('twoslash')
    expect(client).not.toHaveProperty('markdown')
    expect(config.codeHighlight.langs).toBe(ruby)
    expect(config.twoslash).toEqual({ checkOnly: true })
    expect(JSON.stringify(client).length).toBeLessThan(JSON.stringify(config).length / 10)
    const restored = ConfigSerializer.deserializeFunctions(
      ConfigSerializer.serializeFunctions(client),
    ) as ClientConfig.ClientConfig
    expect(typeof restored.head === 'function' && restored.head('/', {})).toEqual({ title: 'Home' })
  })

  test('provides separate client and server modules', async () => {
    const config = fixture()
    Config.setGlobal(config)
    const plugin = virtualConfig(config) as Plugin
    if (typeof plugin.load !== 'function') throw new Error('Expected load hook')
    const client = await plugin.load.call({} as never, '\0virtual:vocs/client-config')
    const server = await plugin.load.call({} as never, '\0virtual:vocs/config')
    expect(client).not.toContain('"repository"')
    expect(client).not.toContain('"checkOnly"')
    expect(server).toContain('"repository"')
    expect(server).toContain('"checkOnly"')
  })

  test('projects development updates and invalidates both modules', async () => {
    const config = fixture()
    const resolve = vi.spyOn(Config, 'resolve').mockResolvedValue(config)
    const modules = new Map([
      ['\0virtual:vocs/config', { id: 'server' }],
      ['\0virtual:vocs/client-config', { id: 'client' }],
    ])
    const invalidateModule = vi.fn()
    const send = vi.fn()
    let onChange: (path: string) => Promise<void> = async () => {}
    const plugin = virtualConfig(config) as Plugin
    if (typeof plugin.configureServer !== 'function') throw new Error('Expected server hook')
    try {
      await plugin.configureServer.call(
        {} as never,
        {
          watcher: {
            on: (_event: string, handler: typeof onChange) => {
              onChange = handler
            },
          },
          moduleGraph: { getModuleById: (id: string) => modules.get(id), invalidateModule },
          ws: { send },
        } as never,
      )
      await onChange('/project/vocs.config.ts')
      expect(invalidateModule).toHaveBeenCalledTimes(2)
      const update = send.mock.calls[0]?.[0]
      expect(update.type).toBe('custom')
      expect(update.data.codeHighlight).not.toHaveProperty('langs')
      expect(update.data).not.toHaveProperty('twoslash')
      expect(update.data.head).toContain('_vocs-fn_')
    } finally {
      resolve.mockRestore()
    }
  })
})
