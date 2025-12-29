import type { Frontmatter } from '../internal/types.js'
import { Head } from './Head.js'
import { Layout } from './Layout.js'

export function MdxPage({ children, frontmatter, pathname }: MdxPage.Props) {
  return (
    <>
      <Head frontmatter={frontmatter} pathname={pathname} />
      <Layout>{children}</Layout>
    </>
  )
}

export declare namespace MdxPage {
  export type Props = {
    children: React.ReactNode
    frontmatter?: Frontmatter | undefined
    pathname: string
  }
}
