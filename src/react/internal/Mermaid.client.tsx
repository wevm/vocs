'use client'

import * as React from 'react'
import { useColorScheme } from '../useColorScheme.js'

const themes = {
  light: { bg: '#ffffff', fg: '#27272a' },
  dark: { bg: '#18181b', fg: '#e4e4e7', line: '#71717a', muted: '#a1a1aa', accent: '#a1a1aa' },
} as const

export function MermaidClient(props: MermaidClient.Props) {
  const { chart } = props
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [svg, setSvg] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const colorScheme = useColorScheme()

  React.useEffect(() => {
    let cancelled = false

    async function render() {
      try {
        const { renderMermaid } = await import('beautiful-mermaid')
        const result = await renderMermaid(chart, {
          ...themes[colorScheme],
          transparent: true,
        })
        if (!cancelled) setSvg(result)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err))
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [chart, colorScheme])

  if (error) {
    return (
      <div data-v-mermaid-error>
        <pre>{error}</pre>
      </div>
    )
  }

  if (!svg) {
    return <div data-v-mermaid-loading>Loading diagram...</div>
  }

  return (
    <div
      ref={containerRef}
      data-v-mermaid
      // biome-ignore lint/security/noDangerouslySetInnerHtml: _
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export declare namespace MermaidClient {
  type Props = {
    chart: string
  }
}
