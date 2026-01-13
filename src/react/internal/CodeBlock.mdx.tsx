import { cx } from 'cva'
import { bundleDeps } from '../Sandbox/bundleDeps.js'
import { SandboxProvider } from '../Sandbox/Provider.js'
import { CopyButton, ShellLineCopyButtons } from './CodeBlock.client.js'
import { CollapseHandler } from './Collapse.client.js'
import { FoldHandler } from './Fold.client.js'

export async function CodeBlock(props: CodeBlock.Props) {
  const {
    className,
    container = true,
    'data-v-lang': _lang,
    'data-v-shell': isShell,
    'data-title': title,
    'data-sandbox': isSandbox,
    'data-sandbox-code': sandboxCode,
    'data-sandbox-deps': sandboxDepsRaw,
    'data-sandbox-auto-run': sandboxAutoRun,
    'data-sandbox-lang': sandboxLang,
  } = props

  if (!container) return <pre {...props} data-v />

  const sandboxProps =
    isSandbox !== undefined
      ? await prepareSandbox({
          code: sandboxCode ?? '',
          deps: sandboxDepsRaw ? JSON.parse(sandboxDepsRaw) : {},
          autoRun: sandboxAutoRun === 'true',
          lang: sandboxLang ?? 'ts',
        })
      : null

  return (
    <div data-v-code-container {...(sandboxProps && { 'data-v-sandbox': '' })}>
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
        <CopyButton />
        {isShell !== undefined && <ShellLineCopyButtons />}
        <CollapseHandler />
        <FoldHandler />
      </pre>
      {sandboxProps && (
        <SandboxProvider
          code={sandboxProps.code}
          autoRun={sandboxProps.autoRun}
          showConsole={true}
          showPreview={false}
          bundledFiles={sandboxProps.bundledFiles}
        />
      )}
    </div>
  )
}

async function prepareSandbox(options: {
  code: string
  deps: Record<string, string>
  autoRun: boolean
  lang: string
}) {
  const { code, deps, autoRun } = options
  const codeStr = code.trim()
  const bundledFiles = await bundleDeps(deps, codeStr)

  return {
    code: codeStr,
    autoRun,
    bundledFiles,
  }
}

export namespace CodeBlock {
  export type Props = React.PropsWithChildren<React.ComponentProps<'pre'>> & {
    container?: boolean | undefined
    'data-v-lang'?: string | undefined
    'data-v-shell'?: '' | undefined
    'data-title'?: string | undefined
    'data-sandbox'?: string | undefined
    'data-sandbox-code'?: string | undefined
    'data-sandbox-deps'?: string | undefined
    'data-sandbox-auto-run'?: string | undefined
    'data-sandbox-lang'?: string | undefined
  }
}
