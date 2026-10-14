import type { BlockContent, PhrasingContent, RootContent } from 'mdast'
import type { MarkdownRenderer } from './markdown-output.js'

/** Built-in components use the same renderer contract as site-owned modules. */
export const markdown: Record<string, MarkdownRenderer> = {
  Cards: (_props, context) => context.renderChildren(),
  Tabs: (_props, context) => context.renderChildren(),
  Tab: (props, context) => [
    ...(context.inline
      ? [{ type: 'text' as const, value: `${required(props, 'title')}: ` }]
      : [
          {
            type: 'heading' as const,
            depth: 3 as const,
            children: [{ type: 'text' as const, value: required(props, 'title') }],
          },
        ]),
    ...context.renderChildren(),
  ],
  Card: (props, context) => {
    const children: PhrasingContent[] = [
      {
        type: 'link',
        url: required(props, 'to'),
        children: [{ type: 'text', value: required(props, 'title') }],
      },
      ...(typeof props['description'] === 'string'
        ? [{ type: 'text' as const, value: `: ${props['description']}` }]
        : []),
    ]
    return [
      ...(context.inline ? children : [{ type: 'paragraph' as const, children }]),
      ...context.renderChildren(),
    ]
  },
  Badge: (_props, context) => context.renderChildren(),
  Callout: (props, context) => {
    const title: PhrasingContent[] =
      typeof props['title'] === 'string'
        ? [{ type: 'strong', children: [{ type: 'text', value: `${props['title']}:` }] }]
        : []
    if (context.inline)
      return [
        ...title,
        ...(title.length ? [{ type: 'text' as const, value: ' ' }] : []),
        ...context.renderChildren(),
      ]
    const children: RootContent[] = [
      ...(title.length ? [{ type: 'paragraph' as const, children: title }] : []),
      ...context.renderChildren(),
    ]
    return [{ type: 'blockquote', children: children as BlockContent[] }]
  },
}

function required(props: Record<string, unknown>, name: string) {
  const value = props[name]
  if (typeof value !== 'string' || !value.trim())
    throw new TypeError(`Markdown component requires a static ${name}.`)
  return value
}
