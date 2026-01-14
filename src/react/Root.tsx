import { config } from 'virtual:vocs/config'
// biome-ignore lint/suspicious/noTsIgnore: _
// @ts-ignore
import groupIconsCss from 'virtual:vocs/group-icons.css?inline'
// biome-ignore lint/suspicious/noTsIgnore: _
// @ts-ignore
import userStyles from 'virtual:vocs/user-styles'
// biome-ignore lint/suspicious/noTsIgnore: _
// @ts-ignore
import styles from '../styles/index.css?url'
import { Head } from './Head.js'
import { Root_client } from './Root.client.js'
import { ScrollRestoration } from './ScrollRestoration.js'

export async function Root({ children }: { children: React.ReactNode }) {
  const { colorScheme, accentColor } = config
  return (
    <html
      data-vocs
      lang="en"
      style={{ colorScheme, '--vocs-color-accent': accentColor } as never}
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href={styles} precedence="default" />
        {userStyles && <link rel="stylesheet" href={userStyles} precedence="default" />}
        {/** biome-ignore lint/security/noDangerouslySetInnerHtml: TODO: switch to non-setHTML loading */}
        {groupIconsCss && <style dangerouslySetInnerHTML={{ __html: groupIconsCss }} />}
        <Head />
      </head>
      <body data-version="1.0">
        <Root_client>{children}</Root_client>
        <ScrollRestoration />
      </body>
    </html>
  )
}
