import type { IconifyJSON } from '@iconify/types'
import { getIconData, iconToHTML, iconToSVG } from '@iconify/utils'
import { Link } from './Link.js'

export function Cards(props: Cards.Props) {
  return (
    <div className="vocs:grid vocs:grid-cols-1 vocs:md:grid-cols-2 vocs:gap-4">
      {props.children}
    </div>
  )
}

export namespace Cards {
  export type Props = {
    children: React.ReactNode
  }

  export async function Card(props: Card.Props) {
    const { title, description, icon, to } = props

    const html = await (async () => {
      if (!icon) return null

      const [prefix, name] = icon.split(':')
      if (!prefix || !name) return null

      try {
        const module = (await import(/* @vite-ignore */ `@iconify-json/${prefix}`)) as {
          icons: IconifyJSON
        }
        const data = getIconData(module.icons, name)
        if (!data) return null

        const svg = iconToSVG(data)
        return iconToHTML(svg.body, svg.attributes)
      } catch {
        return null
      }
    })()

    return (
      <Link
        to={to}
        className="vocs:flex vocs:flex-col vocs:space-y-2 vocs:rounded-md vocs:bg-surfaceTint/70 vocs:border vocs:border-primary vocs:p-4 vocs:no-underline vocs:transition-colors vocs:hover:bg-surfaceTint"
      >
        {html ? (
          <div
            className="vocs:size-8 vocs:flex vocs:items-center vocs:justify-center vocs:rounded-lg vocs:border vocs:border-primary vocs:bg-surface vocs:text-accent"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: _
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : null}

        <div className="vocs:text-[15px] vocs:font-medium vocs:text-heading">{title}</div>

        <div className="vocs:text-sm vocs:leading-relaxed vocs:text-secondary">{description}</div>
      </Link>
    )
  }

  export declare namespace Card {
    export type Props = {
      title: string
      description: string
      icon?: string | undefined
      to: string
    }
  }
}
