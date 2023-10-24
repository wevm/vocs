import { File } from './svgs/File.js'
import { Terminal } from './svgs/Terminal.js'

export function CodeTitle({ children, ...props }: { children: string }) {
  const language = 'data-language' in props ? props['data-language'] : undefined
  return (
    <div {...props}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {language === 'bash' ? (
          <Terminal width={14} height={14} style={{ marginTop: 3 }} />
        ) : children.match(/\.(.*)$/) ? (
          <File width={14} height={14} style={{ marginTop: 1 }} />
        ) : null}
        {children}
      </div>
    </div>
  )
}
