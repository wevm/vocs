import * as Icons from '../internal/icons.js'
import * as Markdown from '../internal/markdown.js'
import { Link } from './Link.js'

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

export async function Card(props: Card.Props) {
  const { title, description, icon, to, topRight } = props

  const iconHtml = icon ? ((await Icons.resolveIcon(icon)) ?? null) : null
  const descriptionHtml = Markdown.toHtml(description)

  return (
    <Link
      to={to}
      className="vocs:relative vocs:flex vocs:flex-col vocs:space-y-2 vocs:rounded-md vocs:bg-surfaceTint/70 vocs:border vocs:border-primary vocs:p-4 vocs:no-underline vocs:transition-colors vocs:hover:bg-surfaceTint"
    >
      {topRight ? (
        <div className="vocs:absolute vocs:top-4 vocs:right-4">{topRight}</div>
      ) : null}

      {iconHtml ? (
        <div
          className="vocs:size-8 vocs:flex vocs:items-center vocs:justify-center vocs:rounded-lg vocs:border vocs:border-primary vocs:bg-surface vocs:text-accent"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: _
          dangerouslySetInnerHTML={{ __html: iconHtml }}
        />
      ) : null}

      <div className="vocs:text-[15px] vocs:font-medium vocs:text-heading">{title}</div>

      <div
        className="vocs:text-sm vocs:leading-relaxed vocs:text-secondary"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: _
        dangerouslySetInnerHTML={{ __html: descriptionHtml }}
      />
    </Link>
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
