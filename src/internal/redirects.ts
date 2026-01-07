import { URLPattern } from 'node:url'

/**
 * A redirect input that maps an incoming request path to a destination.
 */
export type Input = {
  /** Incoming request path pattern (e.g., '/docs/:path*') */
  source: string
  /** Target path or external URL (e.g., '/documentation/:path*') */
  destination: string
  /** HTTP status code (default: 307) */
  status?: 301 | 302 | 307 | 308
}

/**
 * A collection of redirect inputs.
 */
export type Inputs = readonly Input[]

/**
 * A redirect rule with a pre-built URLPattern for efficient matching.
 */
export type Rule = {
  source: string
  destination: string
  status: number
  pattern: URLPattern
}

/**
 * A collection of redirect rules.
 */
export type Rules = readonly Rule[]

/**
 * Generates redirect rules from inputs.
 *
 * @param inputs - The redirect inputs to generate rules from.
 * @returns Rules with URLPattern instances.
 *
 * @example
 * const rules = Redirects.from([
 *   { source: '/old', destination: '/new' },
 *   { source: '/docs/:path*', destination: '/documentation/:path*' },
 * ])
 */
export function from(inputs: Inputs): from.ReturnType {
  return inputs.map((input) => ({
    source: input.source,
    destination: input.destination,
    status: input.status ?? 307,
    pattern: new URLPattern({ pathname: input.source }),
  }))
}

export declare namespace from {
  export type ReturnType = Rules
}

/**
 * Resolves a path against compiled redirect rules.
 *
 * @param path - The request path to match.
 * @param compiledRules - The compiled redirect rules.
 * @returns The matched redirect result, or undefined if no match.
 *
 * @example
 * const rules = Redirects.compile([{ source: '/old', destination: '/new' }])
 * const result = Redirects.resolve('/old', rules)
 * // { source: '/old', destination: '/new', status: 307, params: {} }
 */
export function resolve(path: string, rules: Rules): resolve.Result | undefined {
  for (const rule of rules) {
    const result = rule.pattern.exec({ pathname: path })
    if (result) {
      const groups = result.pathname.groups as Record<string, string | undefined>
      const destination = interpolate(rule.destination, groups)
      return {
        source: rule.source,
        destination,
        status: rule.status,
        params: groups,
      }
    }
  }
  return undefined
}

export declare namespace resolve {
  export type Result = {
    source: string
    destination: string
    status: number
    params: Record<string, string | undefined>
  }
}

/**
 * Interpolates path parameters into a template string.
 */
function interpolate(template: string, params: Record<string, string | undefined>): string {
  return template.replace(/:(\w+)(\*|\+|\?)?/g, (_, key) => {
    const value = params[key]
    return value ?? ''
  })
}
