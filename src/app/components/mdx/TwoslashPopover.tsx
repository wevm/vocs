import { type ReactElement, useEffect, useRef } from 'react'

export function TwoslashPopover({ children, ...props }: { children: ReactElement[] }) {
  const popoverRef = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    ;(async () => {
      const { createPopper } = await import('@popperjs/core')

      if (!popoverRef.current) return

      const target = popoverRef.current.querySelector('.twoslash-target')
      const popover = popoverRef.current.querySelector('.twoslash-popup-info-hover')

      if (!target || !popover) return

      const popperInstance = createPopper(target, popover as HTMLElement, {
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [-8, 8],
            },
          },
        ],
        placement: 'bottom-start',
      })

      let hovering = false

      function show() {
        setTimeout(() => {
          popover?.setAttribute('data-show', '')
        }, 64)

        popperInstance.setOptions((options) => ({
          ...options,
          modifiers: [...(options.modifiers || []), { name: 'eventListeners', enabled: true }],
        }))

        popperInstance.update()
      }

      function hide() {
        setTimeout(() => {
          if (!hovering) popover?.removeAttribute('data-show')
          hovering = false
        }, 64)

        popperInstance.setOptions((options) => ({
          ...options,
          modifiers: [...(options.modifiers || []), { name: 'eventListeners', enabled: false }],
        }))
      }

      function hover() {
        hovering = true
      }

      function unhover() {
        hovering = false
        popover?.removeAttribute('data-show')
      }

      for (const e of ['mouseenter', 'focus']) {
        target.addEventListener(e, show)
        popover.addEventListener(e, hover)
      }

      for (const e of ['mouseleave', 'blur']) {
        target.addEventListener(e, hide)
        popover.addEventListener(e, unhover)
      }
    })()
  }, [])

  return (
    <span ref={popoverRef} {...props}>
      {children}
    </span>
  )
}
