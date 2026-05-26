export function Badge(props: Badge.Props) {
  const { variant = 'info', children, ...rest } = props
  return (
    <span {...rest} data-v-badge data-v-context={variant}>
      {children}
    </span>
  )
}

export declare namespace Badge {
  export type Props = React.PropsWithChildren<{
    className?: string | undefined
    variant?: 'note' | 'info' | 'warning' | 'danger' | 'tip' | 'success'
  }>
}
