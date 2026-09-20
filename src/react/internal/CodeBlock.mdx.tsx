import { cx } from 'cva'
import { style } from 'zyzz/default'
import { CopyButton, ShellLineCopyButtons, WrapButton } from './CodeBlock.client.js'
import { CollapseHandler } from './Collapse.client.js'
import { FoldHandler } from './Fold.client.js'

namespace styles {
  export const codeBlock = style({ position: 'relative' })
  export const codeBlock2 = style({
    borderTopLeftRadius: '0',
    borderTopRightRadius: '0',
    borderTopStyle: 'solid',
    borderTopWidth: '0px',
  })
}

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
          styles.codeBlock({ className: 'vocs-group/code' }).className,
          title ? styles.codeBlock2().className : '',
        )}
        data-v-wrapped={showWrap !== undefined ? '' : undefined}
        data-v
      >
        {props.children}
        {showWrap !== undefined && <WrapButton defaultWrapped />}
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
