import { style } from 'zyzz/default'
import * as Icons from '../internal/icons.js'
import * as Markdown from '../internal/markdown.js'
import { CardLink } from './Card.client.js'

namespace styles {
  export const cards = style({
    display: 'grid',
    gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
    gap: 4,
    '@media (width >= 48rem)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  })
}

export function Cards(props: Cards.Props) {
  return <div {...styles.cards()}>{props.children}</div>
}

export declare namespace Cards {
  export type Props = {
    children: React.ReactNode
  }
}

export function Card(props: Card.Props) {
  const { title, description, icon, to, topRight } = props

  const iconHtml = icon ? (Icons.resolveIconSync(icon) ?? null) : null
  const descriptionHtml = Markdown.toHtml(description)

  return (
    <CardLink
      to={to}
      title={title}
      descriptionHtml={descriptionHtml}
      iconHtml={iconHtml}
      topRight={topRight}
    />
  )
}

export declare namespace Card {
  export type Props = {
    title: string
    description: string
    icon?: string | undefined
    to: string
    topRight?: React.ReactNode | undefined
  }
}
