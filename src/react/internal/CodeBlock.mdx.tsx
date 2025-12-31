export function CodeBlock(props: CodeBlock.Props) {
  const { className, container = true, 'data-lang': lang, 'data-title': title } = props
  if (!container) return <pre {...props} data-md />
  return (
    <div data-code-container>
      {title && (
        <div data-code-header>
          <span data-code-title>{title}</span>
        </div>
      )}
      <pre
        {...props}
        className={`${className}${title ? ' vocs:rounded-t-none vocs:border-t-0' : ''}`}
        data-md
      />
    </div>
  )
}

export namespace CodeBlock {
  export type Props = React.PropsWithChildren<React.ComponentProps<'pre'>> & {
    container?: boolean | undefined
    'data-lang'?: string | undefined
    'data-title'?: string | undefined
  }
}
