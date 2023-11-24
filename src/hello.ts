/**
 * Hello parameters
 */
export type HelloParameters = {
  /**
   * Gesture of welcome or salutation
   *
   * @default 'Hello'
   */
  greeting?: string | undefined
  /**
   * Name to greet
   */
  name: string
}

/**
 * Hello return type
 */
export type HelloReturnType = string

/**
 * Returns greeting message for name.
 *
 * @example
 * import { hello } from 'hello'
 *
 * const message = hello({ name: 'World' })
 */
export function hello(parameters: HelloParameters): HelloReturnType {
  const { greeting = 'Hello', name } = parameters
  return `${greeting}, ${name}`
}
