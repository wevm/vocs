export type Mode = false | 'view' | 'enter'

export type Input = boolean | Mode

export type Scope = 'default' | 'sidebar' | 'topNav'

export type Config =
  | Input
  | {
      mode?: Input | undefined
      sidebar?: Input | undefined
      topNav?: Input | undefined
    }

export function normalize(value: normalize.Options): normalize.ReturnType {
  if (value === undefined) return undefined
  if (value === true) return 'view'
  return value
}

export declare namespace normalize {
  type Options = Input | undefined
  type ReturnType = Mode | undefined
}

export function resolve(options: resolve.Options): resolve.ReturnType {
  const { config, fallbackMode, mode, routeConfig, scope = 'default' } = options

  return (
    normalize(mode) ??
    getScopedMode(routeConfig, scope) ??
    getScopedMode(config, scope) ??
    fallbackMode
  )
}

export declare namespace resolve {
  type Options = {
    config?: Config | undefined
    fallbackMode: Mode
    mode?: Input | undefined
    routeConfig?: Config | undefined
    scope?: Scope | undefined
  }

  type ReturnType = Mode
}

export function toWakuProps(mode: toWakuProps.Options): toWakuProps.ReturnType {
  if (mode === 'enter') return { unstable_prefetchOnEnter: true }
  if (mode === 'view') return { unstable_prefetchOnView: true }
  return {}
}

export declare namespace toWakuProps {
  type Options = Mode
  type ReturnType =
    | { unstable_prefetchOnEnter: true }
    | { unstable_prefetchOnView: true }
    | {}
}

function getScopedMode(config: Config | undefined, scope: Scope): Mode | undefined {
  if (config === undefined) return undefined
  if (typeof config !== 'object') return normalize(config)

  const scopedMode = scope === 'default' ? undefined : normalize(config[scope])
  return scopedMode ?? normalize(config.mode)
}
