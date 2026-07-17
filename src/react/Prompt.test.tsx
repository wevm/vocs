import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Prompt } from './Prompt.js'

describe('Prompt', () => {
  it('renders detected tokens and copy controls', () => {
    const html = renderToStaticMarkup(
      <Prompt
        className="custom"
        value={'Read https://vocs.dev and update `vocs.config.ts`.\n\nRequirements:'}
      />,
    )

    expect(html).toContain('class="custom"')
    expect(html).toContain('data-v-prompt="true"')
    expect(html).toContain('data-v-prompt-token="url"')
    expect(html).toContain('href="https://vocs.dev"')
    expect(html).toContain('data-v-prompt-token="code"')
    expect(html).toContain('data-v-prompt-token="label"')
    expect(html).toContain('data-v-prompt-icon="true"')
    expect(html).toContain('aria-label="Copy instructions for agent"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-label="View Prompt"')
    expect(html).toContain('https://chatgpt.com?hints=search&amp;q=')
    expect(html).toContain('https://claude.ai/new?q=')
  })
})
