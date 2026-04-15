import { config } from 'virtual:vocs/config'
// biome-ignore lint/suspicious/noTsIgnore: _
// @ts-ignore
import groupIconsCss from 'virtual:vocs/group-icons.css?inline'
// biome-ignore lint/suspicious/noTsIgnore: _
// @ts-ignore
import userStyles from 'virtual:vocs/user-styles?inline'
import { tokenClassesScript } from '../internal/shiki-token-classes.js'
// biome-ignore lint/suspicious/noTsIgnore: _
// @ts-ignore
import styles from '../styles/index.css?inline'
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
        {/* Critical CSS inlined for faster FCP/LCP - eliminates render-blocking requests */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: inlined CSS for performance */}
        <style dangerouslySetInnerHTML={{ __html: styles }} />
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: inlined user CSS for performance */}
        {userStyles && <style dangerouslySetInnerHTML={{ __html: userStyles }} />}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: group icons CSS */}
        {groupIconsCss && <style dangerouslySetInnerHTML={{ __html: groupIconsCss }} />}
        <Head />
      </head>
      <body data-version="1.0">
        <Root_client>{children}</Root_client>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: inline script hydrates token colors */}
        <script dangerouslySetInnerHTML={{ __html: tokenClassesScript }} />
        <ScrollRestoration />
      </body>
    </html>
  )
}
