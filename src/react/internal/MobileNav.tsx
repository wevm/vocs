'use client'

import { Dialog } from '@base-ui/react/dialog'
import { Menu } from '@base-ui/react/menu'
import * as React from 'react'
import { useRouter } from 'waku'
import LucideArrowUpRight from '~icons/lucide/arrow-up-right'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideTextAlignJustify from '~icons/lucide/text-align-justify'
import LucideX from '~icons/lucide/x'
import * as Path from '../../internal/path.js'
import * as TopNav_core from '../../internal/topNav.js'
import { style, vars } from '../../styles/zyzz.config.js'
import { Link } from '../Link.js'
import { useConfig } from '../useConfig.js'
import * as Sidebar from './Sidebar.js'
import * as Socials from './Socials.client.js'
import * as ThemeToggle from './ThemeToggle.client.js'

namespace styles {
  export const trigger = style({
    display: 'flex',
    width: '8',
    height: '8',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
  })

  export const backdrop = style({
    position: 'fixed',
    inset: '0',
    zIndex: 40,
    backgroundColor: 'black',
    '@supports (color: color-mix(in lab, red, red))': {
      backgroundColor: `color-mix(in oklab, ${vars.color.black} 50%, transparent) !custom`,
    },
    WebkitBackdropFilter: `blur(${vars.blur.sm})        `,
    backdropFilter: `blur(${vars.blur.sm})        `,
    transitionProperty: 'opacity',
    transitionTimingFunction: 'standard',
    transitionDuration: '200ms !custom',
    selectors: {
      '&[data-ending-style]': {
        opacity: '0%',
      },
      '&[data-starting-style]': {
        opacity: '0%',
      },
    },
  })

  export const popup = style({
    position: 'fixed',
    top: '0',
    right: '0',
    zIndex: 50,
    height: '100% !custom',
    width: '320px !custom',
    borderLeftStyle: 'solid',
    borderLeftWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'primary',
    boxShadow:
      '0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    transitionProperty: 'transform, translate, scale, rotate',
    transitionTimingFunction: 'standard',
    transitionDuration: '200ms !custom',
    selectors: {
      '&[data-ending-style]': {
        translate: '100% 0 !custom',
      },
      '&[data-starting-style]': {
        translate: '100% 0 !custom',
      },
    },
  })

  export const header = style({
    display: 'flex',
    height: 'topNav',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1',
    paddingInline: '2',
  })

  export const title = style({
    position: 'absolute',
    width: '1px !custom',
    height: '1px !custom',
    padding: '0 !custom',
    margin: '-1px !custom',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
    borderWidth: '0',
  })

  export const content = style({
    display: 'flex',
    height: `calc(100% - ${vars.spacing.topNav}) !custom`,
    flexDirection: 'column',
    overflowY: 'auto',
    paddingInline: '4',
    paddingBottom: '4',
  })

  export const footer = style({
    marginTop: 'auto !custom',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '4',
  })

  export const topNavTrigger = style({
    display: 'flex',
    flex: 1,
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 'md',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    paddingInline: '2',
    paddingBlock: 'oneAndHalf',
    fontSize: '14px !custom',
    fontWeight: '450 !custom',
    color: 'heading',
  })

  export const chevronIcon = style({
    width: '4',
    height: '4',
    color: 'secondary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.secondary} 80%, transparent) !custom`,
    },
  })

  export const topNavPositioner = style({
    zIndex: 60,
  })

  export const topNavPopup = style({
    width: 'var(--anchor-width) !custom',
    transformOrigin: 'var(--transform-origin)',
    scale: '100% 100%',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    padding: '2',
    opacity: '100%',
    boxShadow:
      '0 0 #0000, 0 0 #0000, 0 0 #0000, 0 0 #0000, 0 10px 15px -3px oklab(from rgb(0 0 0 / 0.1) l a b / 5%), 0 4px 6px -4px oklab(from rgb(0 0 0 / 0.1) l a b / 5%)',
    transitionProperty: 'all',
    transitionTimingFunction: 'standard',
    transitionDuration: '75ms !custom',
    selectors: {
      '&[data-starting-style]': {
        scale: '90% 90%',
        opacity: '0%',
      },
    },
  })

  export const groupLabel = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingInline: '2',
    paddingBlock: 'oneAndHalf',
    fontSize: '14px !custom',
    fontWeight: '450 !custom',
    color: 'primary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.primary} 80%, transparent) !custom`,
    },
  })

  export const childItem = style({
    marginLeft: '2',
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '1',
    borderRadius: 'md',
    paddingBlock: '1',
    paddingRight: '2',
    paddingLeft: '2',
    fontSize: '13px !custom',
    fontWeight: '450 !custom',
    color: 'primary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.primary} 80%, transparent) !custom`,
    },
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'heading',
        },
      },
      '&[data-checked]': {
        backgroundColor: 'accenta3',
        color: 'accent8 !important',
      },
    },
  })

  export const externalIcon = style({
    width: '3',
    height: '3',
    color: 'secondary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.secondary} 60%, transparent) !custom`,
    },
  })

  export const topLevelItem = style({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '1',
    borderRadius: 'md',
    paddingInline: '2',
    paddingBlock: 'oneAndHalf',
    fontSize: '14px !custom',
    fontWeight: '450 !custom',
    color: 'primary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.primary} 80%, transparent) !custom`,
    },
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'heading',
        },
      },
      '&[data-checked]': {
        backgroundColor: 'accenta3',
        color: 'accent8 !important',
      },
    },
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
      <Dialog.Trigger aria-label="Open menu" {...styles.trigger({ className })}>
        <LucideTextAlignJustify />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop {...styles.backdrop()} />
        <Dialog.Popup {...styles.popup()} data-v-mobile-nav>
          <div {...styles.header()}>
            <Dialog.Title {...styles.title()}>Menu</Dialog.Title>

            <MobileTopNav onNavigate={() => setDialogOpen(false)} />

            <Dialog.Close aria-label="Close menu" {...styles.trigger()}>
              <LucideX />
            </Dialog.Close>
          </div>

          <div {...styles.content()} ref={sidebarScrollRef}>
            <Sidebar.Sidebar onNavigate={() => setDialogOpen(false)} scrollRef={sidebarScrollRef} />

            <div {...styles.footer()} data-v-mobile-nav-footer>
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
      <Menu.Trigger {...styles.topNavTrigger()}>
        <span>{activeItem?.text}</span>
        <LucideChevronDown {...styles.chevronIcon()} />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="start" sideOffset={4} {...styles.topNavPositioner()}>
          <Menu.Popup {...styles.topNavPopup()}>
            <Menu.RadioGroup value={activeLink}>
              {items.map((item, i) => {
                if (item.items) {
                  return (
                    // biome-ignore lint/suspicious/noArrayIndexKey: _
                    <Menu.Group key={i}>
                      <Menu.GroupLabel {...styles.groupLabel()}>{item.text}</Menu.GroupLabel>
                      {item.items.map((child, j) => {
                        const isExternal = child.external ?? Path.isExternal(child.link)
                        return (
                          <Menu.RadioItem
                            {...styles.childItem()}
                            // biome-ignore lint/suspicious/noArrayIndexKey: _
                            key={j}
                            value={child.link}
                            onClick={handleNavigate}
                            // @ts-expect-error
                            // biome-ignore lint/style/noNonNullAssertion: _
                            render={<Link to={child.link!} />}
                          >
                            {child.text}
                            {isExternal && <LucideArrowUpRight {...styles.externalIcon()} />}
                          </Menu.RadioItem>
                        )
                      })}
                    </Menu.Group>
                  )
                }

                const isExternal = item.external ?? Path.isExternal(item.link)
                return (
                  <Menu.RadioItem
                    {...styles.topLevelItem()}
                    // biome-ignore lint/suspicious/noArrayIndexKey: _
                    key={i}
                    value={item.link}
                    onClick={handleNavigate}
                    // @ts-expect-error
                    // biome-ignore lint/style/noNonNullAssertion: _
                    render={<Link to={item.link!} />}
                  >
                    {item.text}
                    {isExternal && <LucideArrowUpRight {...styles.externalIcon()} />}
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
