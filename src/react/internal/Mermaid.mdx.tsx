import { MermaidClient } from './Mermaid.client.js'

export function Mermaid(props: Mermaid.Props) {
  const { chart } = props
  return (
    <div data-v-mermaid-container>
      <MermaidClient chart={chart} />
    </div>
  )
}

export declare namespace Mermaid {
  type Props = {
    chart: string
  }
}
