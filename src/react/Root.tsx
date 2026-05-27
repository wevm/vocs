import { config } from 'virtual:vocs/config'
import groupIconsStylesUrl from 'virtual:vocs/group-icons.css?url'
import userStylesUrl from 'virtual:vocs/user-styles'
import stylesUrl from '../styles/index.css?url'
import { Head } from './Head.js'
import { Root_client } from './Root.client.js'
import { ScrollRestoration } from './ScrollRestoration.js'

export async function Root({ children }: { children: React.ReactNode }) {
  const { colorScheme, accentColor } = config
  return (
    <html
      data-vocs
      {...(colorScheme === 'light' || colorScheme === 'dark'
        ? { 'data-vocs-theme': colorScheme }
        : {})}
      lang="en"
      style={{ colorScheme, '--vocs-color-accent': accentColor } as never}
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href={stylesUrl} />
        {userStylesUrl && <link rel="stylesheet" href={userStylesUrl} />}
        {groupIconsStylesUrl && <link rel="stylesheet" href={groupIconsStylesUrl} />}
        <Head />
      </head>
      <body data-version="1.0">
        <Root_client>{children}</Root_client>
        <ScrollRestoration />
      </body>
    </html>
  )
}
