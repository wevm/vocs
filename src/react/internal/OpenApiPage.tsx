import type { Operation } from '../../internal/openapi.js'
import { OpenApiOperation } from './OpenApi.js'

export function OpenApiPage(props: OpenApiPage.Props) {
  const { operation } = props
  return (
    <article data-v-content>
      <hgroup data-v>
        <h1 data-v>{operation.summary ?? operation.operationId}</h1>
        {operation.description && <p>{operation.description}</p>}
      </hgroup>
      <OpenApiOperation operation={operation} />
    </article>
  )
}

export declare namespace OpenApiPage {
  export type Props = {
    operation: Operation
  }
}
