import * as Icons from '../internal/icons.js'
import * as Markdown from '../internal/markdown.js'
import { CardLink } from './Card.client.js'

export function Cards(props: Cards.Props) {
  return (
    <div className="vocs:grid vocs:grid-cols-1 vocs:md:grid-cols-2 vocs:gap-4">
      {props.children}
    </div>
  )
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
