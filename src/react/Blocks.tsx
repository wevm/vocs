/**
 * Block components. `<Blocks />` renders a page's blocks in order, and each block component
 * renders one block type. Every element carries a `data-vocs` name and `data-vocs-part` names,
 * which are public styling API.
 * @module
 */
import * as React from 'react'
import type * as Block from '../Block.js'
import * as Diagram from '../internal/Diagram.js'
import { Markdown, spans } from '../internal/Markdown.js'
import { style, vars } from '../zyzz.config.js'

/** Renders blocks in order. A `demo` block renders the component registered under its name. */
export function Blocks(props: Blocks.Props) {
  const [diagram] = React.useState(() => Diagram.create())
  return (
    <div data-vocs="blocks" {...styles.blocks({ className: props.className })}>
      {props.blocks.map((block, index) => (
        <BlockView block={block} demos={props.demos} diagram={diagram} key={index} />
      ))}
    </div>
  )
}

export declare namespace Blocks {
  type Props = {
    blocks: readonly Block.Rendered[]
    className?: string | undefined
    /** Components that `demo` blocks may name. */
    demos?: Record<string, React.ComponentType> | undefined
  }
}

function BlockView(props: {
  block: Block.Rendered
  demos: Blocks.Props['demos']
  diagram: Diagram.Diagram
}) {
  const block = props.block
  if (block.type === 'callout') return <Callout {...block} />
  if (block.type === 'cards') return <Cards {...block} />
  if (block.type === 'code') return <Code {...block} />
  if (block.type === 'codeGroup') return <CodeGroup {...block} />
  if (block.type === 'demo') {
    const Demo = props.demos?.[block.name]
    return (
      <div data-state={Demo ? 'ready' : 'missing'} data-vocs="demo" {...styles.demo()}>
        {Demo ? <Demo /> : `Demo "${block.name}" is not registered.`}
      </div>
    )
  }
  if (block.type === 'fileTree') return <FileTree {...block} />
  if (block.type === 'heading') {
    const Tag = block.level === 2 ? 'h2' : 'h3'
    return (
      <Tag data-level={block.level} data-vocs="heading" {...styles.heading()}>
        {spans(block.text)}
      </Tag>
    )
  }
  if (block.type === 'mermaid') return <Mermaid diagram={block.diagram} renderer={props.diagram} />
  if (block.type === 'prose')
    return (
      <div data-vocs="prose" {...styles.prose()}>
        <Markdown text={block.markdown} />
      </div>
    )
  if (block.type === 'steps') return <Steps {...block} />
  return <Terminal {...block} />
}

/**
 * A Mermaid diagram, rendered to SVG by Ondine in the page. The source shows until the SVG is
 * ready, and stays when the source does not render.
 */
function Mermaid(props: { diagram: string; renderer: Diagram.Diagram }) {
  const [state, setState] = React.useState<
    { status: 'failed' | 'rendering' } | { status: 'rendered'; svg: string }
  >({ status: 'rendering' })
  const latest = React.useRef(props.diagram)

  React.useEffect(() => {
    latest.current = props.diagram
    setState({ status: 'rendering' })
    props.renderer.render(props.diagram).then(
      (svg) => {
        if (latest.current === props.diagram) setState({ status: 'rendered', svg })
      },
      () => {
        if (latest.current === props.diagram) setState({ status: 'failed' })
      },
    )
  }, [props.diagram, props.renderer])

  return (
    <figure data-state={state.status} data-vocs="mermaid" {...styles.mermaid()}>
      {state.status === 'rendered' ? (
        // Ondine compiles the source to SVG and escapes every label, so the markup holds no script.
        <div dangerouslySetInnerHTML={{ __html: state.svg }} data-vocs-part="svg" />
      ) : (
        <pre data-vocs-part="source" {...styles.pre()}>
          <code>{props.diagram}</code>
        </pre>
      )}
    </figure>
  )
}

/** A note, tip, warning, or danger notice. */
export function Callout(props: Callout.Props) {
  return (
    <aside data-kind={props.kind} data-vocs="callout" {...styles.callout()}>
      {props.title && (
        <p data-vocs-part="title" {...styles.calloutTitle()}>
          {spans(props.title)}
        </p>
      )}
      <div data-vocs-part="body" {...styles.prose()}>
        <Markdown text={props.body} />
      </div>
    </aside>
  )
}

export declare namespace Callout {
  type Props = Omit<Block.schema.Block & { type: 'callout' }, 'type'>
}

/** A grid of linked cards. */
export function Cards(props: Cards.Props) {
  return (
    <div data-vocs="cards" {...styles.cards()}>
      {props.cards.map((card, index) => {
        const content = (
          <>
            <p data-vocs-part="title" {...styles.cardTitle()}>
              {spans(card.title)}
            </p>
            <div data-vocs-part="description" {...styles.cardDescription()}>
              <Markdown text={card.description} />
            </div>
          </>
        )
        return card.href ? (
          <a data-vocs="card" href={card.href} key={index} rel="noreferrer" {...styles.card()}>
            {content}
          </a>
        ) : (
          <div data-vocs="card" key={index} {...styles.card()}>
            {content}
          </div>
        )
      })}
    </div>
  )
}

export declare namespace Cards {
  type Props = Omit<Block.schema.Block & { type: 'cards' }, 'type'>
}

/**
 * A code block with an optional file name. With `html` from the render route, it shows the
 * highlighted code, and Twoslash types on hover.
 */
export function Code(props: Code.Props) {
  return (
    <figure
      data-lang={props.lang}
      data-state={props.html === undefined ? 'plain' : 'highlighted'}
      data-vocs="code"
      {...styles.figure()}
    >
      {props.title && (
        <figcaption data-vocs-part="title" {...styles.caption()}>
          {props.title}
        </figcaption>
      )}
      <pre data-vocs-part="pre" {...styles.pre()}>
        <Source code={props.code} html={props.html} />
      </pre>
    </figure>
  )
}

/** The `<code>` of a snippet: highlighted HTML from the render route, or the plain source. */
function Source(props: { code: string; html: string | undefined }) {
  // The render route escapes the source, and its markup holds only spans and Twoslash popups.
  if (props.html !== undefined) return <code dangerouslySetInnerHTML={{ __html: props.html }} />
  return <code>{props.code}</code>
}

export declare namespace Code {
  type Props = Omit<Block.Rendered & { type: 'code' }, 'type'>
}

/** Alternatives of one snippet, one tab each. */
export function CodeGroup(props: CodeGroup.Props) {
  const [selected, setSelected] = React.useState(0)
  const id = React.useId()
  const tab = props.tabs[selected] ?? props.tabs[0]!
  return (
    <figure data-vocs="code-group" {...styles.figure()}>
      <div aria-label="Code variants" data-vocs-part="tabs" role="tablist" {...styles.tabs()}>
        {props.tabs.map((entry, index) => (
          <button
            aria-controls={`${id}-panel`}
            aria-selected={index === selected}
            data-state={index === selected ? 'active' : 'inactive'}
            data-vocs-part="tab"
            key={index}
            onClick={() => setSelected(index)}
            role="tab"
            type="button"
            {...styles.tab()}
          >
            {entry.title}
          </button>
        ))}
      </div>
      <pre
        data-lang={tab.lang}
        data-state={tab.html === undefined ? 'plain' : 'highlighted'}
        data-vocs-part="pre"
        id={`${id}-panel`}
        role="tabpanel"
        {...styles.pre()}
      >
        <Source code={tab.code} html={tab.html} />
      </pre>
    </figure>
  )
}

export declare namespace CodeGroup {
  type Props = Omit<Block.Rendered & { type: 'codeGroup' }, 'type'>
}

/** A list of project paths with notes. */
export function FileTree(props: FileTree.Props) {
  return (
    <ul data-vocs="file-tree" {...styles.fileTree()}>
      {props.entries.map((entry, index) => {
        const depth = entry.path.split('/').length - 1
        return (
          <li
            data-depth={Math.min(depth, 4)}
            data-vocs-part="entry"
            key={index}
            {...styles.entry()}
          >
            <code>{entry.path.split('/').at(-1)}</code>
            {entry.note && (
              <span data-vocs-part="note" {...styles.note()}>
                {spans(entry.note)}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export declare namespace FileTree {
  type Props = Omit<Block.schema.Block & { type: 'fileTree' }, 'type'>
}

/** Numbered steps, each with a title and a body. */
export function Steps(props: Steps.Props) {
  return (
    <ol data-vocs="steps" {...styles.steps()}>
      {props.steps.map((step, index) => (
        <li data-vocs-part="step" key={index} {...styles.step()}>
          <p data-vocs-part="title" {...styles.stepTitle()}>
            {spans(step.title)}
          </p>
          <div data-vocs-part="body" {...styles.prose()}>
            <Markdown text={step.body} />
          </div>
        </li>
      ))}
    </ol>
  )
}

export declare namespace Steps {
  type Props = Omit<Block.schema.Block & { type: 'steps' }, 'type'>
}

/** Shell commands with their output. */
export function Terminal(props: Terminal.Props) {
  return (
    <div data-vocs="terminal" {...styles.terminal()}>
      {props.commands.map((entry, index) => (
        <React.Fragment key={index}>
          <pre data-vocs-part="command" {...styles.command()}>
            <code>{entry.command}</code>
          </pre>
          {entry.output && (
            <pre data-vocs-part="output" {...styles.output()}>
              <code>{entry.output}</code>
            </pre>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export declare namespace Terminal {
  type Props = Omit<Block.schema.Block & { type: 'terminal' }, 'type'>
}

namespace styles {
  export const blocks = style({
    '@layer vocs': { display: 'flex', flexDirection: 'column', gap: 6 },
  })

  export const callout = style({
    '@layer vocs': {
      borderInlineStartColor: 'border',
      borderInlineStartStyle: 'solid',
      borderInlineStartWidth: '2px',
      color: vars.color.foreground,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      paddingBlock: 1,
      paddingInline: 4,
      '&[data-kind="danger"], &[data-kind="warning"]': { borderInlineStartColor: 'foreground' },
    },
  })

  export const calloutTitle = style({
    '@layer vocs': { fontWeight: 600, margin: 0 },
  })

  export const caption = style({
    '@layer vocs': {
      borderBlockEndColor: 'border',
      borderBlockEndStyle: 'solid',
      borderBlockEndWidth: '1px',
      color: vars.color.muted,
      fontFamily: vars.fontFamily.mono,
      fontSize: 'sm',
      paddingBlock: 2,
      paddingInline: 4,
    },
  })

  export const card = style({
    '@layer vocs': {
      borderColor: vars.color.border,
      borderRadius: vars.radius.md,
      borderStyle: 'solid',
      borderWidth: '1px',
      color: vars.color.foreground,
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      padding: 4,
      textDecoration: 'none',
      '&:hover': { borderColor: vars.color.accent },
    },
  })

  export const cardDescription = style({
    '@layer vocs': { color: vars.color.muted, fontSize: 'sm' },
  })

  export const cardTitle = style({
    '@layer vocs': { fontWeight: 600, margin: 0 },
  })

  export const cards = style({
    '@layer vocs': {
      display: 'grid',
      gap: 3,
      gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))',
    },
  })

  export const command = style({
    '@layer vocs': {
      color: vars.color.foreground,
      fontFamily: vars.fontFamily.mono,
      fontSize: 'sm',
      margin: 0,
      '&::before': { color: vars.color.muted, content: '"$ "' },
    },
  })

  export const mermaid = style({
    '@layer vocs': {
      borderColor: vars.color.border,
      borderRadius: vars.radius.md,
      borderStyle: 'solid',
      borderWidth: '1px',
      display: 'flex',
      justifyContent: 'center',
      margin: 0,
      overflowX: 'auto',
      padding: 4,
      '--ondine-bg': vars.color.background,
      '--ondine-fg': vars.color.foreground,
      '--ondine-font': vars.fontFamily.mono,
      '--ondine-muted': vars.color.muted,
      '--ondine-radius': vars.radius.sm,
      '--ondine-stroke': '1px',
      '& svg': { height: 'auto', maxWidth: 'full' },
    },
  })

  export const demo = style({
    '@layer vocs': {
      borderColor: vars.color.border,
      borderRadius: vars.radius.md,
      borderStyle: 'dashed',
      borderWidth: '1px',
      padding: 4,
    },
  })

  export const entry = style({
    '@layer vocs': {
      alignItems: 'baseline',
      display: 'flex',
      gap: 3,
      '&[data-depth="1"]': { paddingInlineStart: 4 },
      '&[data-depth="2"]': { paddingInlineStart: 8 },
      '&[data-depth="3"]': { paddingInlineStart: 12 },
      '&[data-depth="4"]': { paddingInlineStart: 16 },
    },
  })

  export const figure = style({
    '@layer vocs': {
      backgroundColor: vars.color.surface,
      borderColor: vars.color.border,
      borderRadius: vars.radius.md,
      borderStyle: 'solid',
      borderWidth: '1px',
      margin: 0,
      overflow: 'hidden',
    },
  })

  export const fileTree = style({
    '@layer vocs': {
      backgroundColor: vars.color.surface,
      borderColor: vars.color.border,
      borderRadius: vars.radius.md,
      borderStyle: 'solid',
      borderWidth: '1px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: vars.fontFamily.mono,
      fontSize: 'sm',
      gap: 1,
      listStyle: 'none',
      margin: 0,
      paddingBlock: 3,
      paddingInline: 4,
    },
  })

  export const heading = style({
    '@layer vocs': {
      fontWeight: 600,
      lineHeight: 1.3,
      marginBlock: 0,
      marginBlockStart: 2,
      '&[data-level="2"]': { fontSize: 'lg' },
      '&[data-level="3"]': { fontSize: 'md' },
    },
  })

  export const note = style({
    '@layer vocs': { color: vars.color.muted, fontFamily: vars.fontFamily.sans },
  })

  export const output = style({
    '@layer vocs': {
      color: vars.color.muted,
      fontFamily: vars.fontFamily.mono,
      fontSize: 'sm',
      margin: 0,
      whiteSpace: 'pre-wrap',
    },
  })

  // Twoslash popups use fixed positioning anchored to the hovered token, so the scrolling `pre`
  // does not clip them. Only one token is hovered at a time, so one anchor name serves all.
  export const pre = style({
    '@layer vocs': {
      fontFamily: vars.fontFamily.mono,
      fontSize: 'sm',
      lineHeight: 1.6,
      margin: 0,
      overflowX: 'auto',
      paddingBlock: 3,
      paddingInline: 4,
      '& [data-vocs-part="hover"]': {
        textDecorationColor: vars.color.transparent,
        textDecorationLine: 'underline',
        textDecorationStyle: 'dotted',
        textUnderlineOffset: '3px',
      },
      '&:hover [data-vocs-part="hover"]': { textDecorationColor: vars.color.muted },
      '& [data-vocs-part="hover"]:hover': { anchorName: '--vocs-twoslash' },
      '& [data-vocs-part="popup"]': {
        backgroundColor: vars.color.background,
        borderColor: vars.color.border,
        borderRadius: vars.radius.md,
        borderStyle: 'solid',
        borderWidth: '1px',
        boxShadow: 'md',
        display: 'none',
        flexDirection: 'column',
        insetBlockStart: 'anchor(bottom) !custom',
        insetInlineStart: 'anchor(left) !custom',
        marginBlockStart: 1,
        maxInlineSize: 'min(36rem, 90vw) !custom',
        position: 'fixed',
        positionAnchor: '--vocs-twoslash',
        positionTryFallbacks: 'flip-block',
        whiteSpace: 'pre-wrap',
        zIndex: 10,
      },
      '& [data-vocs-part="hover"]:hover > [data-vocs-part="popup"]': { display: 'flex' },
      '& [data-vocs-part="types"]': { paddingBlock: 2, paddingInline: 3 },
      '& [data-vocs-part="types"] pre': {
        fontFamily: vars.fontFamily.mono,
        margin: 0,
        whiteSpace: 'pre-wrap',
      },
      '& [data-vocs-part="docs"]': {
        borderBlockStartColor: 'border',
        borderBlockStartStyle: 'solid',
        borderBlockStartWidth: '1px',
        color: vars.color.muted,
        fontFamily: vars.fontFamily.sans,
        paddingBlock: 2,
        paddingInline: 3,
      },
      '& [data-vocs-part="tags"]': {
        borderBlockStartColor: 'border',
        borderBlockStartStyle: 'solid',
        borderBlockStartWidth: '1px',
        color: vars.color.muted,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: vars.fontFamily.sans,
        paddingBlock: 2,
        paddingInline: 3,
      },
      '& .twoslash-popup-docs-tag-name': {
        color: vars.color.foreground,
        fontFamily: vars.fontFamily.mono,
        marginInlineEnd: 2,
      },
      '& .twoslash-popup-arrow': { display: 'none' },
      '& .twoslash-query-line > .twoslash-popup-container': {
        backgroundColor: vars.color.background,
        borderColor: vars.color.border,
        borderRadius: vars.radius.sm,
        borderStyle: 'solid',
        borderWidth: '1px',
        display: 'inline-block',
      },
      '& .twoslash-query-line [data-vocs-part="types"]': { paddingBlock: 0, paddingInline: 2 },
      '& .twoslash-error': { textDecorationLine: 'underline', textDecorationStyle: 'wavy' },
      '& .twoslash-error-line': {
        borderInlineStartColor: 'foreground',
        borderInlineStartStyle: 'solid',
        borderInlineStartWidth: '2px',
        color: vars.color.muted,
        fontFamily: vars.fontFamily.sans,
        paddingInlineStart: 2,
      },
    },
  })

  export const prose = style({
    '@layer vocs': {
      lineHeight: 1.7,
      '& > :first-child': { marginBlockStart: 0 },
      '& > :last-child': { marginBlockEnd: 0 },
      '& a': { color: vars.color.accent },
      '& code': {
        backgroundColor: vars.color.surface,
        borderRadius: vars.radius.sm,
        fontFamily: vars.fontFamily.mono,
        fontSize: 'sm',
        paddingInline: 1,
      },
      '& p': { marginBlock: 2 },
    },
  })

  export const step = style({
    '@layer vocs': {
      borderInlineStartColor: 'border',
      borderInlineStartStyle: 'solid',
      borderInlineStartWidth: '1px',
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      paddingInlineStart: 6,
      position: 'relative',
      '&::before': {
        alignItems: 'center',
        backgroundColor: vars.color.surface,
        borderColor: vars.color.border,
        borderRadius: vars.radius.full,
        borderStyle: 'solid',
        borderWidth: '1px',
        content: 'counter(vocs-step)',
        counterIncrement: 'vocs-step',
        display: 'flex',
        fontSize: 'sm',
        height: 6,
        insetBlockStart: 0,
        insetInlineStart: '-0.75rem !custom',
        justifyContent: 'center',
        position: 'absolute',
        width: 6,
      },
    },
  })

  export const stepTitle = style({
    '@layer vocs': { fontWeight: 600, margin: 0 },
  })

  export const steps = style({
    '@layer vocs': {
      counterReset: 'vocs-step',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      listStyle: 'none',
      margin: 0,
      paddingInlineStart: 3,
    },
  })

  export const tab = style({
    '@layer vocs': {
      backgroundColor: 'transparent',
      borderBlockEndColor: 'transparent',
      borderBlockEndStyle: 'solid',
      borderBlockEndWidth: '2px',
      borderBlockStartWidth: 0,
      borderInlineWidth: 0,
      color: vars.color.muted,
      cursor: 'pointer',
      fontFamily: vars.fontFamily.mono,
      fontSize: 'sm',
      paddingBlock: 2,
      paddingInline: 3,
      '&[data-state="active"]': { borderBlockEndColor: 'accent', color: vars.color.foreground },
      '&:focus-visible': { outlineColor: 'accent', outlineStyle: 'solid', outlineWidth: '2px' },
    },
  })

  export const tabs = style({
    '@layer vocs': {
      borderBlockEndColor: 'border',
      borderBlockEndStyle: 'solid',
      borderBlockEndWidth: '1px',
      display: 'flex',
      paddingInline: 2,
    },
  })

  export const terminal = style({
    '@layer vocs': {
      backgroundColor: vars.color.surface,
      borderColor: vars.color.border,
      borderRadius: vars.radius.md,
      borderStyle: 'solid',
      borderWidth: '1px',
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      overflowX: 'auto',
      paddingBlock: 3,
      paddingInline: 4,
    },
  })
}
