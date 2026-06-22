import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, test } from 'vitest'

import { TwoslashCompletionList } from './TwoslashCompletionList.js'

describe('TwoslashCompletionList', () => {
  test('renders completions inline', () => {
    const html = renderToStaticMarkup(
      <TwoslashCompletionList className="twoslash-completion-cursor">
        <ul className="twoslash-completion-list">
          <li>apple</li>
        </ul>
      </TwoslashCompletionList>,
    )

    expect(html).toContain('twoslash-completion-cursor')
    expect(html).toContain('data-v-twoslash-completion')
    expect(html).toContain('data-v-twoslash-completion-cursor')
    expect(html).toContain('data-v-twoslash-completion-popup')
    expect(html).toContain('twoslash-completion-list')
    expect(html).not.toContain('data-base-ui')
  })
})
