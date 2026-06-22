import type React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const popover = vi.hoisted(() => ({
  Root: vi.fn(({ children }: PopoverProps) => <div data-v-popover-root>{children}</div>),
  Trigger: vi.fn(({ children }: PopoverProps) => <span data-v-popover-trigger>{children}</span>),
  Portal: vi.fn(({ children }: PopoverProps) => <>{children}</>),
  Positioner: vi.fn(({ children }: PopoverProps) => <>{children}</>),
  Popup: vi.fn(({ children, className }: PopoverProps) => (
    <div className={className} data-v-popover-popup>
      {children}
    </div>
  )),
  Arrow: vi.fn(({ children }: PopoverProps) => <span data-v-popover-arrow>{children}</span>),
}))

type PopoverProps = React.PropsWithChildren<{
  className?: string | undefined
  [key: string]: unknown
}>

vi.mock('./CodeToHtml.client.js', () => ({
  prewarm: vi.fn(),
}))

vi.mock('@base-ui/react/popover', () => ({ Popover: popover }))

import { TwoslashHover } from './TwoslashHover.js'

describe('TwoslashHover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders persisted query hovers inline', () => {
    const html = renderToStaticMarkup(
      <TwoslashHover className="twoslash-hover twoslash-query-persisted twoslash-popup-container">
        <span>value</span>
        <pre>type Value = string</pre>
      </TwoslashHover>,
    )

    expect(popover.Root).not.toHaveBeenCalled()
    expect(popover.Trigger).not.toHaveBeenCalled()
    expect(popover.Portal).not.toHaveBeenCalled()
    expect(popover.Positioner).not.toHaveBeenCalled()
    expect(popover.Popup).not.toHaveBeenCalled()
    expect(popover.Arrow).not.toHaveBeenCalled()

    expect(html).toContain('data-v-twoslash-persisted')
    expect(html).toContain('data-v-twoslash-inline-popup')
    expect(html).toContain('data-v-twoslash-inline-arrow')
    expect(html).toContain('twoslash-query-persisted')
    expect(html).toContain('type Value = string')
    expect(html).not.toContain('data-v-popover-root')
  })

  test('renders non-persisted hovers as popovers', () => {
    const html = renderToStaticMarkup(
      <TwoslashHover className="twoslash-hover twoslash-popup-container">
        <span>value</span>
        <pre>type Value = string</pre>
      </TwoslashHover>,
    )

    expect(popover.Root).toHaveBeenCalledTimes(1)
    expect(popover.Trigger).toHaveBeenCalledTimes(1)
    expect(popover.Portal).toHaveBeenCalledTimes(1)
    expect(popover.Positioner).toHaveBeenCalledTimes(1)
    expect(popover.Popup).toHaveBeenCalledTimes(1)
    expect(popover.Arrow).toHaveBeenCalledTimes(1)

    expect(html).toContain('data-v-popover-root')
    expect(html).toContain('twoslash-hover twoslash-popup-container')
    expect(html).toContain('type Value = string')
    expect(html).not.toContain('data-v-twoslash-inline-popup')
  })
})
