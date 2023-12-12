import { clsx } from 'clsx'
import { type DetailedHTMLProps, type HTMLAttributes } from 'react'

import { useLayout } from '../../hooks/useLayout.js'
import { Authors } from '../Authors.js'
import { BlogPosts } from '../BlogPosts.js'
import { Sponsors } from '../Sponsors.js'
import { AutolinkIcon } from './AutolinkIcon.js'
import { CodeGroup } from './CodeGroup.js'
import * as styles from './Div.css.js'
import { Steps } from './Steps.js'
import { Subtitle } from './Subtitle.js'

export function Div(props: DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>) {
  const { layout } = useLayout()

  const className = clsx(props.className, styles.root)

  if (props.className === 'code-group')
    return <CodeGroup {...(props as any)} className={className} />
  if ('data-authors' in props) return <Authors />
  if ('data-blog-posts' in props) return <BlogPosts />
  if ('data-sponsors' in props) return <Sponsors />
  if ('data-autolink-icon' in props && layout === 'docs')
    return <AutolinkIcon {...(props as any)} className={className} />
  if ('data-vocs-steps' in props) return <Steps {...(props as any)} className={className} />
  if (props.role === 'doc-subtitle') return <Subtitle {...(props as any)} />
  return <div {...props} className={className} />
}
