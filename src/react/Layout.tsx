export function Layout({ children }: Layout.Props) {
  return (
    <article
      className="vocs:max-w-content vocs:mx-auto vocs:px-content-px vocs:py-content-py vocs:space-y-6"
      data-content
      data-vocs
    >
      {children}
    </article>
  )
}

export declare namespace Layout {
  export type Props = {
    children: React.ReactNode
  }
}
