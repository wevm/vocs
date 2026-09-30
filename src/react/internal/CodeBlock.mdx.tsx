import { cx as classes } from 'cva'
import { cx } from 'zyzz'
import { style } from '../../styles/zyzz.config.js'
import { CopyButton, ShellLineCopyButtons, WrapButton } from './CodeBlock.client.js'
import { CollapseHandler } from './Collapse.client.js'
import { FoldHandler } from './Fold.client.js'

namespace styles {
  export const code = style({
    position: 'relative',
  })

  export const titledCode = style({
    borderTopLeftRadius: '0 !custom',
    borderTopRightRadius: '0 !custom',
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
        {...cx(
          styles.code({ className: classes(className, 'vocs:group/code') }),
          Boolean(title) && styles.titledCode(),
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
