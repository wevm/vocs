import { Head } from './Head.js'
import * as Layout_client from './Layout.client.js'

export function Layout(props: Layout.Props) {
  const { children } = props
  return (
    <>
      <Head />
      <Layout_client.Main>{children}</Layout_client.Main>
    </>
  )
}

export namespace Layout {
  export type Props = {
    children: React.ReactNode
  }
}
