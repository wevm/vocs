'use client'

import * as React from 'react'
import { useColorScheme } from '../useColorScheme.js'

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
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: colorScheme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose',
          fontFamily: 'inherit',
        })

        const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`
        const { svg } = await mermaid.render(id, chart)
        if (!cancelled) setSvg(svg)
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
