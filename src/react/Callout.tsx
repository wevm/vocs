import LucideCircleCheck from '~icons/lucide/circle-check'
import LucideInfo from '~icons/lucide/info'
import LucideLightbulb from '~icons/lucide/lightbulb'
import LucideTriangleAlert from '~icons/lucide/triangle-alert'

export function Callout(props: Callout.Props) {
  return (
    <aside {...props}>
      <div className="vocs:h-4 vocs:w-4 vocs:mt-[0.325em]">
        {props.variant === 'note' ? <LucideInfo /> : null}
        {props.variant === 'info' ? <LucideInfo /> : null}
        {props.variant === 'warning' ? <LucideTriangleAlert /> : null}
        {props.variant === 'danger' ? <LucideTriangleAlert /> : null}
        {props.variant === 'tip' ? <LucideLightbulb /> : null}
        {props.variant === 'success' ? <LucideCircleCheck /> : null}
      </div>
      <div data-vocs data-content className="vocs:w-full vocs:space-y-3">
        {props.children}
      </div>
    </aside>
  )
}

export declare namespace Callout {
  export type Props = React.PropsWithChildren<{
    variant: 'note' | 'info' | 'warning' | 'danger' | 'tip' | 'success'
  }>
}
