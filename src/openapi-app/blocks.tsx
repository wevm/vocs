import type { CompiledPage, PageBlock } from '../internal/openapi/app.js'
import { Endpoints } from '../react/internal/openapi/Endpoints.js'

/** Renders a compiled override/guide page's ordered blocks. */
export function Blocks(props: { page: CompiledPage }) {
  return (
    <>
      {props.page.blocks.map((block, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: blocks are a fixed, ordered list
        <Block key={index} block={block} />
      ))}
    </>
  )
}

function Block(props: { block: PageBlock }) {
  const { block } = props
  // `<OpenApi.Endpoints />` blocks rehydrate as the real component (resolves the
  // spec from `virtual:vocs/openapi`); everything else is server-compiled HTML.
  if (block.type === 'endpoints') return <Endpoints path={block.path} />
  return (
    <div
      // biome-ignore lint/security/noDangerouslySetInnerHtml: server-compiled trusted page content
      dangerouslySetInnerHTML={{ __html: block.html }}
    />
  )
}
