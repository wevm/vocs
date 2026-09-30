import { NavigationMenu } from '@base-ui/react/navigation-menu'
import * as React from 'react'
import { useRouter } from 'waku'
import LucideArrowUpRight from '~icons/lucide/arrow-up-right'
import LucideChevronDown from '~icons/lucide/chevron-down'
import * as Path from '../../internal/path.js'
import * as TopNav_core from '../../internal/topNav.js'
import { style, vars } from '../../styles/zyzz.config.js'
import { Link } from '../Link.js'
import { useConfig } from '../useConfig.js'

namespace styles {
  export const root = style({
    display: 'flex',
  })

  export const list = style({
    margin: '0',
    marginBottom: '-1px !custom',
    display: 'flex',
    height: '100% !custom',
    listStyleType: 'none',
    alignItems: 'center',
    padding: '0',
  })

  export const positioner = style({
    zIndex: 50,
  })

  export const popup = style({
    minWidth: '200px !custom',
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

  export const arrow = style({
    selectors: {
      '&[data-side="bottom"]': {
        top: '-9px !custom',
      },
      '&[data-side="left"]': {
        right: '-13px !custom',
        rotate: '90deg',
      },
      '&[data-side="right"]': {
        left: '-13px !custom',
        rotate: 'calc(90deg * -1)',
      },
      '&[data-side="top"]': {
        bottom: '-8px !custom',
        rotate: '180deg',
      },
    },
  })

  export const item = style({
    height: '100% !custom',
  })

  export const chevronIcon = style({
    marginLeft: '1',
    color: 'secondary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.secondary} 80%, transparent) !custom`,
    },
    transitionProperty: 'transform, translate, scale, rotate',
    transitionTimingFunction: 'standard',
    transitionDuration: '150ms !custom',
    selectors: {
      ':where(*[data-popup-open]) &': {
        rotate: '180deg',
      },
    },
  })

  export const content = style({
    display: 'flex',
    flexDirection: 'column',
  })

  export const link = style({
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    borderRadius: 'md',
    paddingInline: '2',
    paddingBlock: '1',
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
      '&[data-v-active="true"]': {
        backgroundColor: 'accenta3',
        color: 'accent7',
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

  export const menuExternalIcon = style({
    marginLeft: '1',
    width: 'threeAndHalf',
    height: 'threeAndHalf',
    color: 'secondary',
    '@supports (color: color-mix(in lab, red, red))': {
      color: `color-mix(in oklab, ${vars.textColor.secondary} 60%, transparent) !custom`,
    },
  })

  export const trigger = style({
    display: 'flex',
    height: '100% !custom',
    cursor: 'pointer',
    alignItems: 'center',
    borderBottomStyle: 'solid',
    borderBottomWidth: '2px',
    borderColor: 'transparent !custom',
    paddingInline: '2',
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
      '&[data-v-active="true"]': {
        borderColor: 'accent',
        color: 'accent6',
      },
    },
  })

  export const arrowFill = style({
    fill: vars.backgroundColor.surface,
  })

  export const arrowBorder = style({
    fill: vars.borderColor.primary,
  })
}

export function TopNav(props: TopNav.Props) {
  const { className } = props

  const { topNav } = useConfig()
  const { path } = useRouter()

  const items = React.useMemo(() => TopNav_core.parse(topNav, path), [topNav, path])

  return (
    <NavigationMenu.Root {...styles.root({ className })}>
      <NavigationMenu.List aria-orientation={undefined} {...styles.list()}>
        {items.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: _
          <Item key={i} {...item} />
        ))}
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner side="bottom" sideOffset={-8} {...styles.positioner()}>
          <NavigationMenu.Popup {...styles.popup()}>
            <NavigationMenu.Arrow {...styles.arrow()}>
              <ArrowSvg />
            </NavigationMenu.Arrow>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  )
}

export function Item(props: Item.Props) {
  const { active, external, items, link, text } = props

  const isExternal = external ?? Path.isExternal(link)

  if (items)
    return (
      <NavigationMenu.Item {...styles.item()}>
        <NavigationMenu.Trigger {...styles.trigger()} data-v-active={active}>
          {text}
          <NavigationMenu.Icon>
            <LucideChevronDown {...styles.chevronIcon()} />
          </NavigationMenu.Icon>
        </NavigationMenu.Trigger>
        <NavigationMenu.Content {...styles.content()}>
          {items.map((item, i) => {
            const itemIsExternal = item.external ?? Path.isExternal(item.link)
            return (
              <NavigationMenu.Link
                {...styles.link()}
                data-v-active={item.active}
                // biome-ignore lint/suspicious/noArrayIndexKey: _
                key={i}
                // @ts-expect-error
                // biome-ignore lint/style/noNonNullAssertion: _
                render={<Link to={item.link!} />}
              >
                {item.text}
                {itemIsExternal && <LucideArrowUpRight {...styles.externalIcon()} />}
              </NavigationMenu.Link>
            )
          })}
        </NavigationMenu.Content>
      </NavigationMenu.Item>
    )

  if (!link) return null

  return (
    <NavigationMenu.Item {...styles.item()}>
      <NavigationMenu.Link
        {...styles.trigger()}
        data-v-active={active}
        // @ts-expect-error
        render={<Link to={link} />}
      >
        {text}
        {isExternal && <LucideArrowUpRight {...styles.menuExternalIcon()} />}
      </NavigationMenu.Link>
    </NavigationMenu.Item>
  )
}

export namespace TopNav {
  export type Props = {
    className?: string | undefined
  }
}

export namespace Item {
  export type Props = TopNav_core.ParsedItem
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <title>Arrow</title>
      <path
        {...styles.arrowFill()}
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
      />
      <path
        {...styles.arrowBorder()}
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
      />
    </svg>
  )
}
