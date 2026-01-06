'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Menu } from '@base-ui/react/menu'
import { cx } from 'cva'
import * as React from 'react'
import { Link, useRouter } from 'waku'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideTextAlignJustify from '~icons/lucide/text-align-justify'
import LucideX from '~icons/lucide/x'
import * as TopNav_core from '../../internal/topNav.js'
import { useConfig } from '../useConfig.js'
import * as Sidebar from './Sidebar.js'

export function MobileNav(props: MobileNav.Props) {
  const { className } = props

  const sidebarScrollRef = React.useRef<HTMLDivElement>(null)

  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
      <Dialog.Trigger
        className={cx(
          'vocs:flex vocs:items-center vocs:justify-center vocs:cursor-pointer vocs:size-8',
          className,
        )}
      >
        <LucideTextAlignJustify />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="vocs:fixed vocs:inset-0 vocs:bg-black/50 vocs:backdrop-blur-sm vocs:z-40 vocs:transition-opacity vocs:duration-200 vocs:data-starting-style:opacity-0 vocs:data-ending-style:opacity-0" />
        <Dialog.Popup
          className="vocs:fixed vocs:top-0 vocs:right-0 vocs:h-full vocs:w-[320px] vocs:bg-primary vocs:z-50 vocs:shadow-xl vocs:transition-transform vocs:duration-200 vocs:data-starting-style:translate-x-full vocs:data-ending-style:translate-x-full"
          data-v-mobile-nav
        >
          <div className="vocs:flex vocs:justify-between vocs:items-center vocs:gap-1 vocs:px-2 vocs:h-topNav">
            <Dialog.Title className="vocs:sr-only">Menu</Dialog.Title>

            <MobileTopNav onNavigate={() => setDialogOpen(false)} />

            <Dialog.Close className="vocs:flex vocs:items-center vocs:justify-center vocs:cursor-pointer vocs:size-8">
              <LucideX />
            </Dialog.Close>
          </div>

          <div
            className="vocs:overflow-y-auto vocs:h-[calc(100%-var(--vocs-spacing-topNav))] vocs:px-4 vocs:pb-4"
            ref={sidebarScrollRef}
          >
            <Sidebar.Sidebar onNavigate={() => setDialogOpen(false)} scrollRef={sidebarScrollRef} />
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export declare namespace MobileNav {
  export type Props = {
    className?: string | undefined
  }
}

// biome-ignore lint/correctness/noUnusedVariables: _
function MobileTopNav(props: MobileTopNav.Props) {
  const { onNavigate } = props

  const { topNav } = useConfig()
  const { path } = useRouter()

  const [menuOpen, setMenuOpen] = React.useState(false)

  const items = React.useMemo(() => TopNav_core.parse(topNav, path), [topNav, path])

  const activeItem = React.useMemo(() => {
    for (const item of items) {
      if (item.items) {
        const activeChild = item.items.find((child) => child.active)
        if (activeChild) return activeChild
      } else if (item.active) return item
    }
    return items[0]
  }, [items])

  const activeLink = activeItem?.link

  const handleNavigate = React.useCallback(() => {
    setMenuOpen(false)
    onNavigate()
  }, [onNavigate])

  if (items.length === 0) return null
  return (
    <Menu.Root open={menuOpen} onOpenChange={setMenuOpen}>
      <Menu.Trigger className="vocs:flex vocs:flex-1 vocs:items-center vocs:justify-between vocs:border vocs:border-primary vocs:bg-surface vocs:px-2 vocs:py-1.5 vocs:text-heading vocs:text-[14px] vocs:font-[450] vocs:rounded-md vocs:cursor-pointer">
        <span>{activeItem?.text}</span>
        <LucideChevronDown className="vocs:text-secondary/80 vocs:size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="start" sideOffset={4} className="vocs:z-60">
          <Menu.Popup className="vocs:bg-surface vocs:w-(--anchor-width) vocs:border vocs:border-primary vocs:p-2 vocs:rounded-lg vocs:shadow-lg/5 vocs:origin-(--transform-origin) vocs:transition-all vocs:duration-75 vocs:scale-100 vocs:opacity-100 vocs:data-starting-style:opacity-0 vocs:data-starting-style:scale-90">
            <Menu.RadioGroup value={activeLink}>
              {items.map((item, i) => {
                if (item.items) {
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: _
                    <Menu.Group key={i}>
                      <Menu.GroupLabel className="vocs:flex vocs:items-center vocs:justify-between vocs:px-2 vocs:py-1.5 vocs:text-primary/80 vocs:text-[14px] vocs:font-[450]">
                        {item.text}
                      </Menu.GroupLabel>
                      {item.items.map((child, j) => (
                        <Menu.RadioItem
                          className="vocs:flex vocs:items-center vocs:justify-between vocs:hover:text-heading vocs:ml-2 vocs:pl-2 vocs:pr-2 vocs:py-1 vocs:text-primary/80 vocs:data-checked:bg-accenta3 vocs:data-checked:text-accent8! vocs:rounded-md vocs:text-[13px] vocs:font-[450] vocs:cursor-pointer"
                          // biome-ignore lint/suspicious/noArrayIndexKey: _
                          key={j}
                          value={child.link}
                          onClick={handleNavigate}
                          // @ts-expect-error
                          // biome-ignore lint/style/noNonNullAssertion: _
                          render={<Link to={child.link!} unstable_prefetchOnView />}
                        >
                          {child.text}
                        </Menu.RadioItem>
                      ))}
                    </Menu.Group>
                  )
                }

                return (
                  <Menu.RadioItem
                    className="vocs:flex vocs:items-center vocs:justify-between vocs:hover:text-heading vocs:px-2 vocs:py-1.5 vocs:text-primary/80 vocs:data-checked:bg-accenta3 vocs:data-checked:text-accent8! vocs:rounded-md vocs:text-[14px] vocs:font-[450] vocs:cursor-pointer"
                    // biome-ignore lint/suspicious/noArrayIndexKey: _
                    key={i}
                    value={item.link}
                    onClick={handleNavigate}
                    // @ts-expect-error
                    // biome-ignore lint/style/noNonNullAssertion: _
                    render={<Link to={item.link!} unstable_prefetchOnView />}
                  >
                    {item.text}
                  </Menu.RadioItem>
                )
              })}
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  )
}

declare namespace MobileTopNav {
  type Props = {
    onNavigate: () => void
  }
}
