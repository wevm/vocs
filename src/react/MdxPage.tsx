import type { Frontmatter } from '../internal/config.js'
import { Layout } from './Layout.js'
import { Provider } from './MdxPageContext.js'

export function MdxPage({ children, frontmatter }: MdxPage.Props) {
  return (
    <Provider frontmatter={frontmatter}>
      <Layout>{children}</Layout>
    </Provider>
  )
}

export declare namespace MdxPage {
  export type Props = {
    children: React.ReactNode
    frontmatter?: Frontmatter | undefined
    pathname: string
  }
}
