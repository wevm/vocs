import { config } from 'virtual:vocs/config'
// biome-ignore lint/suspicious/noTsIgnore: _
// @ts-ignore
import styles from '../styles/index.css?url'
// biome-ignore lint/suspicious/noTsIgnore: _
// @ts-ignore
import userStyles from 'virtual:vocs/user-styles'
import { Head } from './Head.js'
import { Root_client } from './Root.client.js'
import { ScrollRestoration } from './ScrollRestoration.js'

export async function Root({ children }: { children: React.ReactNode }) {
  const { colorScheme, accentColor } = config
  return (
    <html data-vocs lang="en" style={{ colorScheme, '--vocs-color-accent': accentColor } as never}>
      <head>
        <link rel="stylesheet" href={styles} precedence="default" />
        {userStyles && <link rel="stylesheet" href={userStyles} precedence="default" />}
        <Head />
      </head>
      <body data-version="1.0">
        <Root_client>{children}</Root_client>
        <ScrollRestoration />
      </body>
    </html>
  )
}
