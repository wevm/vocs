export function Layout({ children }: Layout.Props) {
  return (
    <main className="vocs:isolate">
      <article data-content>{children}</article>
    </main>
  )
}

export declare namespace Layout {
  export type Props = {
    children: React.ReactNode
  }
}
