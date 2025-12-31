// biome-ignore lint/suspicious/noTsIgnore: _
// @ts-ignore
import '../../../styles/index.css'

import { Head } from '../../../react/Head.js'
import { ScrollRestoration } from '../../../react/ScrollRestoration.js'

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head />
      <ScrollRestoration />
      {children}
    </>
  )
}
