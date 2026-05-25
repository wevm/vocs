import { cx } from 'cva'
import { CopyButton, ShellLineCopyButtons, WrapButton } from './CodeBlock.client.js'
import { CollapseHandler } from './Collapse.client.js'
import { FoldHandler } from './Fold.client.js'

export function CodeBlock(props: CodeBlock.Props) {
  const {
    className,
    container = true,
    'data-v-lang': _lang,
    'data-v-shell': isShell,
    'data-v-show-wrap': showWrap,
    'data-title': title,
  } = props
  if (!container) return <pre {...props} data-v />
  return (
    <div data-v-code-container>
      {title && (
        <div data-v-code-header>
          <span data-v-code-title data-title={title}>
            {title}
          </span>
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
        {showWrap !== undefined && <WrapButton />}
        <CopyButton />
        {isShell !== undefined && <ShellLineCopyButtons />}
        <CollapseHandler />
        <FoldHandler />
      </pre>
    </div>
  )
}

export namespace CodeBlock {
  export type Props = React.PropsWithChildren<React.ComponentProps<'pre'>> & {
    container?: boolean | undefined
    'data-v-lang'?: string | undefined
    'data-v-shell'?: '' | undefined
    'data-v-show-wrap'?: '' | undefined
    'data-title'?: string | undefined
  }
}
