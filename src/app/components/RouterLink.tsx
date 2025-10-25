import { routes } from 'virtual:routes'
import { forwardRef, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { Link, type LinkProps } from 'react-router'

import { mergeRefs } from '../utils/mergeRefs.js'

export type RouterLinkProps = LinkProps

export const RouterLink = forwardRef((props: RouterLinkProps, ref) => {
  const loadRoute = () => routes.find((route) => route.path === props.to)?.lazy()

  const { ref: intersectionRef, inView } = useInView()
  useEffect(() => {
    if (inView) loadRoute()
    // biome-ignore lint/correctness/useExhaustiveDependencies: _
  }, [inView, loadRoute])

  return <Link ref={mergeRefs(ref, intersectionRef)} {...props} />
})
