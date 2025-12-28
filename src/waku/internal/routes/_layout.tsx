// biome-ignore lint/suspicious/noTsIgnore: _
// @ts-ignore
import '../../../styles.tw.css'

import { ScrollRestoration } from '../../../react/ScrollRestoration.js'
import { Head } from '../../react/Head.js'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Head />
      <ScrollRestoration />
      {children}
    </>
  )
}
