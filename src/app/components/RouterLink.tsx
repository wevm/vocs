import { forwardRef } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { routes } from 'virtual:routes'

export type RouterLinkProps = LinkProps

export const RouterLink = forwardRef((props: RouterLinkProps, ref) => {
  return (
    <Link
      ref={ref as any}
      onFocus={() => routes.find((route) => route.path === props.to)?.lazy()}
      onMouseOver={() => routes.find((route) => route.path === props.to)?.lazy()}
      {...props}
    />
  )
})
