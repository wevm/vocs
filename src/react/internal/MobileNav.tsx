'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Menu } from '@base-ui/react/menu'
import { cx } from 'cva'
import * as React from 'react'
import { useRouter } from 'waku'
import { style, theme } from 'zyzz/default'
import LucideArrowUpRight from '~icons/lucide/arrow-up-right'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideTextAlignJustify from '~icons/lucide/text-align-justify'
import LucideX from '~icons/lucide/x'
import * as Path from '../../internal/path.js'
import * as TopNav_core from '../../internal/topNav.js'
import { Link } from '../Link.js'
import { useConfig } from '../useConfig.js'
import * as Sidebar from './Sidebar.js'
import * as Socials from './Socials.client.js'
import * as ThemeToggle from './ThemeToggle.client.js'

namespace styles {
  export const mobileNav = style({
    display: 'flex',
    width: 8,
    height: 8,
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
  })
  export const mobileNav2 = style({
    position: 'fixed',
    inset: 0,
    zIndex: 40,
    backgroundColor: 'color-mix(in oklab, black 50%, transparent)',
    backdropFilter: 'blur(8px)',
    transitionProperty: 'opacity',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '200ms',
    selectors: {
      '&[data-ending-style]': { opacity: '0%' },
      '&[data-starting-style]': { opacity: '0%' },
    },
  })
  export const mobileNav3 = style({
    position: 'fixed',
    top: 0,
    right: 0,
    zIndex: 50,
    height: '100%',
    width: '320px',
    borderLeftStyle: 'solid',
    borderLeftWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.background['200'],
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    transitionProperty: 'transform, translate, scale, rotate',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '200ms',
    selectors: {
      '&[data-ending-style]': {
        translate: '100% 0',
        borderLeftStyle: 'solid',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      '&[data-starting-style]': {
        translate: '100% 0',
        borderLeftStyle: 'solid',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  })
  export const mobileNav4 = style({
    display: 'flex',
    height: 'var(--vocs-layout-topNav)',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 1,
    paddingInline: 2,
  })
  export const mobileNav5 = style({
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  })
  export const mobileNav6 = style({
    display: 'flex',
    width: 8,
    height: 8,
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
  })
  export const mobileNav7 = style({
    display: 'flex',
    height: 'calc(100% - var(--vocs-layout-topNav))',
    flexDirection: 'column',
    overflowY: 'auto',
    paddingInline: 4,
    paddingBottom: 4,
  })
  export const mobileNav8 = style({
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  })
  export const mobileTopNav = style({
    display: 'flex',
    flex: 1,
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    paddingInline: 2,
    paddingBlock: 'calc(0.25rem * 1.5)',
    fontSize: '14px',
    fontWeight: 'medium',
    color: theme.vars.color.foreground,
  })
  export const mobileTopNav2 = style({
    width: 4,
    height: 4,
    color: `color-mix(in oklab, ${theme.vars.color.gray['900']} 80%, transparent)`,
  })
  export const mobileTopNav3 = style({ zIndex: 60 })
  export const mobileTopNav4 = style({
    width: 'var(--anchor-width)',
    transformOrigin: 'var(--transform-origin)',
    scale: '100% 100%',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    padding: 2,
    opacity: '100%',
    boxShadow:
      '0 10px 15px -3px oklab(from rgb(0 0 0 / 0.1) l a b / 5%), 0 4px 6px -4px oklab(from rgb(0 0 0 / 0.1) l a b / 5%)',
    transitionProperty: 'all',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '75ms',
    selectors: {
      '&[data-starting-style]': {
        scale: '90% 90%',
        opacity: '0%',
        borderStyle: 'solid',
        boxShadow:
          '0 10px 15px -3px oklab(from rgb(0 0 0 / 0.1) l a b / 5%), 0 4px 6px -4px oklab(from rgb(0 0 0 / 0.1) l a b / 5%)',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  })
  export const mobileTopNav5 = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingInline: 2,
    paddingBlock: 'calc(0.25rem * 1.5)',
    fontSize: '14px',
    fontWeight: 'medium',
    color: `color-mix(in oklab, ${theme.vars.color.foreground} 80%, transparent)`,
  })
  export const mobileTopNav6 = style({
    marginLeft: 2,
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: 1,
    borderRadius: 'md',
    paddingBlock: 1,
    paddingRight: 2,
    paddingLeft: 2,
    fontSize: '13px',
    fontWeight: 'medium',
    color: `color-mix(in oklab, ${theme.vars.color.foreground} 80%, transparent)`,
    selectors: {
      '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } },
      '&[data-checked]': {
        backgroundColor: theme.vars.color.blue['300'],
        color: 'blue.900 !important',
      },
    },
  })
  export const mobileTopNav7 = style({
    width: 3,
    height: 3,
    color: `color-mix(in oklab, ${theme.vars.color.gray['900']} 60%, transparent)`,
  })
  export const mobileTopNav8 = style({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: 1,
    borderRadius: 'md',
    paddingInline: 2,
    paddingBlock: 'calc(0.25rem * 1.5)',
    fontSize: '14px',
    fontWeight: 'medium',
    color: `color-mix(in oklab, ${theme.vars.color.foreground} 80%, transparent)`,
    selectors: {
      '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } },
      '&[data-checked]': {
        backgroundColor: theme.vars.color.blue['300'],
        color: 'blue.900 !important',
      },
    },
  })
  export const mobileTopNav9 = style({
    width: 3,
    height: 3,
    color: `color-mix(in oklab, ${theme.vars.color.gray['900']} 60%, transparent)`,
  })
}

export function MobileNav(props: MobileNav.Props) {
  const { className } = props
  const { colorScheme } = useConfig()

  const showThemeToggle = colorScheme === 'light dark'

  const sidebarScrollRef = React.useRef<HTMLDivElement>(null)

  const [dialogOpen, setDialogOpen] = React.useState(false)

  return (
    <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
      <Dialog.Trigger
        aria-label="Open menu"
        className={cx(styles.mobileNav().className, className)}
      >
        <LucideTextAlignJustify />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className={styles.mobileNav2().className} />
        <Dialog.Popup className={styles.mobileNav3().className} data-v-mobile-nav>
          <div {...styles.mobileNav4()}>
            <Dialog.Title className={styles.mobileNav5().className}>Menu</Dialog.Title>

            <MobileTopNav onNavigate={() => setDialogOpen(false)} />

            <Dialog.Close aria-label="Close menu" className={styles.mobileNav6().className}>
              <LucideX />
            </Dialog.Close>
          </div>

          <div {...styles.mobileNav7()} ref={sidebarScrollRef}>
            <Sidebar.Sidebar onNavigate={() => setDialogOpen(false)} scrollRef={sidebarScrollRef} />

            <div {...styles.mobileNav8()} data-v-mobile-nav-footer>
              <Socials.Socials />
              {showThemeToggle && <ThemeToggle.ThemeToggle />}
            </div>
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
      <Menu.Trigger className={styles.mobileTopNav().className}>
        <span>{activeItem?.text}</span>
        <LucideChevronDown className={styles.mobileTopNav2().className} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner
          side="bottom"
          align="start"
          sideOffset={4}
          className={styles.mobileTopNav3().className}
        >
          <Menu.Popup className={styles.mobileTopNav4().className}>
            <Menu.RadioGroup value={activeLink}>
              {items.map((item, i) => {
                if (item.items) {
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: _
                    <Menu.Group key={i}>
                      <Menu.GroupLabel className={styles.mobileTopNav5().className}>
                        {item.text}
                      </Menu.GroupLabel>
                      {item.items.map((child, j) => {
                        const isExternal = child.external ?? Path.isExternal(child.link)
                        return (
                          <Menu.RadioItem
                            className={styles.mobileTopNav6().className}
                            // biome-ignore lint/suspicious/noArrayIndexKey: _
                            key={j}
                            value={child.link}
                            onClick={handleNavigate}
                            // @ts-expect-error
                            // biome-ignore lint/style/noNonNullAssertion: _
                            render={<Link to={child.link!} />}
                          >
                            {child.text}
                            {isExternal && (
                              <LucideArrowUpRight className={styles.mobileTopNav7().className} />
                            )}
                          </Menu.RadioItem>
                        )
                      })}
                    </Menu.Group>
                  )
                }

                const isExternal = item.external ?? Path.isExternal(item.link)
                return (
                  <Menu.RadioItem
                    className={styles.mobileTopNav8().className}
                    // biome-ignore lint/suspicious/noArrayIndexKey: _
                    key={i}
                    value={item.link}
                    onClick={handleNavigate}
                    // @ts-expect-error
                    // biome-ignore lint/style/noNonNullAssertion: _
                    render={<Link to={item.link!} />}
                  >
                    {item.text}
                    {isExternal && (
                      <LucideArrowUpRight className={styles.mobileTopNav9().className} />
                    )}
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
