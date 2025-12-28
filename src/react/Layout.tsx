export function Layout({ children }: Layout.Props) {
  return (
    <article data-content data-vocs>
      {children}
    </article>
  )
}

export declare namespace Layout {
  export type Props = {
    children: React.ReactNode
  }
}
