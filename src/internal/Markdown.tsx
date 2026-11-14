/**
 * Renders the inline Markdown of block text fields to React elements: paragraphs, `-` and `1.`
 * lists, `code`, `**bold**`, `*emphasis*`, and `[links](https://…)`. Model output never becomes
 * HTML, and links other than `http` and `https` render as text.
 * @module
 */
import * as React from 'react'

const inline = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g

/** Markdown text as paragraphs and lists. */
export function Markdown(props: Markdown.Props) {
  return props.text
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph, index) => {
      const lines = paragraph.split('\n').map((line) => line.trim())
      if (lines.every((line) => line.startsWith('- ')))
        return (
          <ul key={index}>
            {lines.map((line, item) => (
              <li key={item}>{spans(line.slice(2))}</li>
            ))}
          </ul>
        )
      if (lines.every((line) => /^\d+\.\s/.test(line)))
        return (
          <ol key={index}>
            {lines.map((line, item) => (
              <li key={item}>{spans(line.replace(/^\d+\.\s/, ''))}</li>
            ))}
          </ol>
        )
      return <p key={index}>{spans(lines.join(' '))}</p>
    })
}

export declare namespace Markdown {
  type Props = { text: string }
}

/** Returns the inline elements of one line of Markdown. */
export function spans(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let last = 0
  for (const match of text.matchAll(inline)) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const [, code, strong, emphasis, label, href] = match
    const key = match.index
    if (code !== undefined) nodes.push(<code key={key}>{code}</code>)
    else if (strong !== undefined) nodes.push(<strong key={key}>{spans(strong)}</strong>)
    else if (emphasis !== undefined) nodes.push(<em key={key}>{spans(emphasis)}</em>)
    else
      nodes.push(
        <a href={href} key={key} rel="noreferrer">
          {spans(label!)}
        </a>,
      )
    last = match.index + match[0].length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}
