import { cx } from 'cva'
import { CopyButton } from './CodeBlock.client.js'

export function CodeBlock(props: CodeBlock.Props) {
  const { className, container = true, 'data-v-lang': _lang, 'data-v-title': title } = props
  if (!container) return <pre {...props} data-v />
  return (
    <div data-v-code-container>
      {title && (
        <div data-v-code-header>
          <span data-v-code-title>{title}</span>
        </div>
      )}
      <pre
        {...props}
        className={cx(
          className,
          'vocs:relative vocs:group/code',
          title ? ' vocs:rounded-t-none vocs:border-t-0' : '',
        )}
        data-v
      >
        {props.children}
        <CopyButton />
      </pre>
    </div>
  )
}

export namespace CodeBlock {
  export type Props = React.PropsWithChildren<React.ComponentProps<'pre'>> & {
    container?: boolean | undefined
    'data-v-lang'?: string | undefined
    'data-v-title'?: string | undefined
  }
}
