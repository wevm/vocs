import { Head } from '../../react/Head.js'
// biome-ignore lint/suspicious/noTsIgnore: _
// @ts-ignore
import '../../../tailwind.css'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head />
      {children}
    </>
  )
}
