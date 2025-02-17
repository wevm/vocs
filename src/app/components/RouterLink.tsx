import { routes } from 'virtual:routes'
import { forwardRef, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { Link, type LinkProps } from 'react-router-dom'

import { mergeRefs } from '../utils/mergeRefs.js'

export type RouterLinkProps = LinkProps

export const RouterLink = forwardRef((props: RouterLinkProps, ref) => {
  const loadRoute = () => routes.find((route) => route.path === props.to)?.lazy()

  const { ref: intersectionRef, inView } = useInView()
  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    if (inView) loadRoute()
  }, [inView])

  return <Link ref={mergeRefs(ref, intersectionRef)} {...props} />
})
