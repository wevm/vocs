import { Head } from '../../../react.js'
// @ts-expect-error
import '../../../styles.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head />
      <article
        className="vocs:max-w-content vocs:mx-auto vocs:px-content-px vocs:py-content-py vocs:space-y-6"
        data-content
        data-vocs
      >
        {children}
      </article>
    </>
  )
}
