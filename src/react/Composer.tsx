'use client'
/**
 * `<Composer />` is the prompt box: a Lexical plain-text editor that grows with its content, a
 * mode switch for chat, page, and docs, and a submit button. Enter submits, and Shift+Enter starts
 * a new line.
 * @module
 */
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin'
import { $getRoot, COMMAND_PRIORITY_HIGH, KEY_ENTER_COMMAND, type LexicalEditor } from 'lexical'
import * as React from 'react'
import { style, vars } from '../zyzz.config.js'

/** A prompt box with a mode switch. */
export function Composer(props: Composer.Props) {
  const modes = props.modes ?? ['chat', 'page', 'docs']
  const [mode, setMode] = React.useState<Composer.Mode>(props.defaultMode ?? modes[0] ?? 'chat')
  const [text, setText] = React.useState('')
  const editor = React.useRef<LexicalEditor | null>(null)
  const label = props.label ?? 'Ask a question'

  function submit() {
    const prompt = text.trim()
    if (!prompt) return
    props.onSubmit(prompt, mode)
    editor.current?.update(() => $getRoot().clear())
  }

  return (
    <form
      data-mode={mode}
      data-state={text.trim() ? 'filled' : 'empty'}
      data-vocs="composer"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      {...styles.composer({ className: props.className })}
    >
      <LexicalComposer
        initialConfig={{
          namespace: 'vocs-composer',
          onError(error) {
            throw error
          },
        }}
      >
        <div data-vocs-part="field" {...styles.field()}>
          <PlainTextPlugin
            contentEditable={
              <ContentEditable
                aria-label={label}
                aria-placeholder={props.placeholder ?? label}
                data-vocs-part="editor"
                placeholder={
                  <div data-vocs-part="placeholder" {...styles.placeholder()}>
                    {props.placeholder ?? label}
                  </div>
                }
                {...styles.editor()}
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <OnChangePlugin
          onChange={(state) => setText(state.read(() => $getRoot().getTextContent()))}
        />
        <Controls editor={editor} onEnter={submit} />
      </LexicalComposer>
      <div data-vocs-part="footer" {...styles.footer()}>
        {modes.length > 1 && (
          <div aria-label="Answer as" data-vocs-part="modes" role="radiogroup" {...styles.modes()}>
            {modes.map((entry) => (
              <button
                aria-checked={entry === mode}
                data-state={entry === mode ? 'active' : 'inactive'}
                data-vocs-part="mode"
                key={entry}
                onClick={() => setMode(entry)}
                role="radio"
                type="button"
                {...styles.mode()}
              >
                {labels[entry]}
              </button>
            ))}
          </div>
        )}
        <button
          aria-label={props.submitLabel ?? 'Send'}
          data-vocs-part="submit"
          disabled={!text.trim()}
          type="submit"
          {...styles.submit()}
        >
          <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 16 16" width="16">
            <path
              d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
            />
          </svg>
        </button>
      </div>
    </form>
  )
}

export declare namespace Composer {
  /** `chat` answers in the conversation. `page` writes one page. `docs` writes several pages. */
  type Mode = 'chat' | 'docs' | 'page'

  type Props = {
    className?: string | undefined
    /** The mode selected first. Defaults to the first of `modes`. */
    defaultMode?: Mode | undefined
    /** Accessible name of the editor. Defaults to "Ask a question". */
    label?: string | undefined
    /** Modes the reader can pick, in order. One mode hides the switch. */
    modes?: readonly Mode[] | undefined
    onSubmit(prompt: string, mode: Mode): void
    placeholder?: string | undefined
    /** Accessible name of the submit button. Defaults to "Send". */
    submitLabel?: string | undefined
  }
}

const labels = { chat: 'Chat', docs: 'Docs', page: 'Page' } as const satisfies Record<
  Composer.Mode,
  string
>

/** Exposes the editor and submits on Enter. */
function Controls(props: { editor: React.RefObject<LexicalEditor | null>; onEnter(): void }) {
  const [editor] = useLexicalComposerContext()
  const onEnter = React.useRef(props.onEnter)
  onEnter.current = props.onEnter

  React.useEffect(() => {
    props.editor.current = editor
    return editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        if (event?.shiftKey) return false
        event?.preventDefault()
        onEnter.current()
        return true
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor, props.editor])

  return null
}

namespace styles {
  export const composer = style({
    '@layer vocs': {
      backgroundColor: vars.color.background,
      borderColor: vars.color.border,
      borderRadius: vars.radius.lg,
      borderStyle: 'solid',
      borderWidth: '1px',
      boxShadow: 'md',
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
      paddingBlock: 3,
      paddingInline: 3,
      width: 'full',
      '&:focus-within': { borderColor: vars.color.accent },
    },
  })

  export const editor = style({
    '@layer vocs': {
      color: vars.color.foreground,
      fontSize: 'md',
      lineHeight: 1.6,
      maxHeight: '40vh !custom',
      minHeight: 6,
      outlineStyle: 'none',
      overflowY: 'auto',
      paddingInline: 1,
      whiteSpace: 'pre-wrap',
      '& p': { margin: 0 },
    },
  })

  export const field = style({
    '@layer vocs': { position: 'relative' },
  })

  export const footer = style({
    '@layer vocs': {
      alignItems: 'center',
      display: 'flex',
      gap: 2,
      justifyContent: 'space-between',
    },
  })

  export const mode = style({
    '@layer vocs': {
      backgroundColor: 'transparent',
      borderRadius: vars.radius.full,
      borderWidth: 0,
      color: vars.color.muted,
      cursor: 'pointer',
      fontFamily: vars.fontFamily.sans,
      fontSize: 'sm',
      paddingBlock: 1,
      paddingInline: 3,
      '&[data-state="active"]': {
        backgroundColor: vars.color.surface,
        color: vars.color.foreground,
      },
      '&:focus-visible': { outlineColor: 'accent', outlineStyle: 'solid', outlineWidth: '2px' },
    },
  })

  export const modes = style({
    '@layer vocs': {
      borderColor: vars.color.border,
      borderRadius: vars.radius.full,
      borderStyle: 'solid',
      borderWidth: '1px',
      display: 'flex',
      gap: 1,
      padding: 1,
    },
  })

  export const placeholder = style({
    '@layer vocs': {
      color: vars.color.muted,
      insetBlockStart: 0,
      insetInlineStart: 1,
      pointerEvents: 'none',
      position: 'absolute',
      userSelect: 'none',
    },
  })

  export const submit = style({
    '@layer vocs': {
      alignItems: 'center',
      backgroundColor: vars.color.foreground,
      borderRadius: vars.radius.full,
      borderWidth: 0,
      color: vars.color.background,
      cursor: 'pointer',
      display: 'flex',
      height: 8,
      justifyContent: 'center',
      marginInlineStart: 'auto',
      width: 8,
      '&:disabled': { cursor: 'default', opacity: 0.3 },
      '&:focus-visible': {
        outlineColor: 'accent',
        outlineOffset: '2px',
        outlineStyle: 'solid',
        outlineWidth: '2px',
      },
    },
  })
}
