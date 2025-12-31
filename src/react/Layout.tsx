import { Head } from './Head.js'

export function Layout(props: Layout.Props) {
  const { children } = props
  return (
    <>
      <Head />
      <main className="vocs:isolate" data-v-container>
        <article data-v-content>{children}</article>
      </main>
    </>
  )
}

export declare namespace Layout {
  export type Props = {
    children: React.ReactNode
  }
}
