import LucideCircleCheck from '~icons/lucide/circle-check'
import LucideInfo from '~icons/lucide/info'
import LucideLightbulb from '~icons/lucide/lightbulb'
import LucideTriangleAlert from '~icons/lucide/triangle-alert'

export function Callout(props: Callout.Props) {
  return (
    <aside {...props}>
      <div className="vocs:h-4 vocs:w-4 vocs:mt-[0.325em]">
        {props['data-context'] === 'note' ? <LucideInfo /> : null}
        {props['data-context'] === 'info' ? <LucideInfo /> : null}
        {props['data-context'] === 'warning' ? <LucideTriangleAlert /> : null}
        {props['data-context'] === 'danger' ? <LucideTriangleAlert /> : null}
        {props['data-context'] === 'tip' ? <LucideLightbulb /> : null}
        {props['data-context'] === 'success' ? <LucideCircleCheck /> : null}
      </div>
      <div data-vocs data-content className="vocs:w-full vocs:space-y-3">
        {props.children}
      </div>
    </aside>
  )
}

export declare namespace Callout {
  export type Props = React.PropsWithChildren<
    React.ComponentProps<'aside'> & { 'data-context': string }
  >
}
