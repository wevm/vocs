import * as Config from '../../internal/config.js'
import type * as DirectiveTypes from '../../internal/directive.js'
import { Changelog } from './Changelog.mdx.js'

/** Built-in directive components, dispatched by name. */
const builtins: Record<string, React.ComponentType<DirectiveTypes.Attributes>> = {
  changelog: Changelog,
}

/**
 * Renders a `data-v-directive` marker (emitted by `remarkDirectives`) with
 * its directive's component — user components first, then built-ins — passing
 * attributes through as props.
 */
export async function Directive(props: Directive.Props): Promise<React.JSX.Element | null> {
  const { 'data-v-directive': name, 'data-v-directive-attributes': attributesJson } = props
  const attributes = JSON.parse(attributesJson ?? '{}') as DirectiveTypes.Attributes

  const config = await Config.resolve({ server: true })
  const Component =
    config.markdown?.directives?.find((directive) => directive.name === name && directive.component)
      ?.component ?? builtins[name]
  if (!Component) return null

  return <Component {...attributes} />
}

export declare namespace Directive {
  export type Props = {
    'data-v-directive': string
    'data-v-directive-attributes'?: string | undefined
  }
}
