import { Head } from '../../../react.js'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head />
      {children}
    </>
  )
}
