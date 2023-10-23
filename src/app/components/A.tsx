import { Link, type LinkProps } from 'react-router-dom'

export function A(
  props: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
) {
  const { href } = props
  if (href?.match(/^#/)) return <a {...props} />
  if (href?.match(/^www|https?/)) return <a {...props} target="_blank" rel="noopener noreferrer" />
  const [before, after] = href!.split('#')
  const to = `${before ? `${before}${before !== '/' ? '.html' : ''}` : ''}${
    after ? `#${after}` : ''
  }`
  return <Link {...(props as LinkProps)} to={to} />
}
