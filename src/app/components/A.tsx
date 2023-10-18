import { Link, type LinkProps } from 'react-router-dom'

export function A(
  props: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>,
) {
  const { href } = props
  if (href?.match(/^www|https?/)) return <a {...props} target="_blank" rel="noopener noreferrer" />
  return <Link {...(props as LinkProps)} to={props.href!} />
}
