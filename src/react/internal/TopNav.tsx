import { NavigationMenu } from '@base-ui/react/navigation-menu'
import { cx } from 'cva'
import * as React from 'react'
import { useRouter } from 'waku'
import { style, theme } from 'zyzz/default'
import LucideArrowUpRight from '~icons/lucide/arrow-up-right'
import LucideChevronDown from '~icons/lucide/chevron-down'
import * as Path from '../../internal/path.js'
import * as TopNav_core from '../../internal/topNav.js'
import { Link } from '../Link.js'
import { useConfig } from '../useConfig.js'

namespace styles {
  export const topNav = style({ display: 'flex' })
  export const topNav2 = style({
    margin: 0,
    marginBottom: '-1px',
    display: 'flex',
    height: '100%',
    listStyleType: 'none',
    alignItems: 'center',
    padding: 0,
  })
  export const topNav3 = style({ zIndex: 50 })
  export const topNav4 = style({
    minWidth: '200px',
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
  export const topNav5 = style({
    selectors: {
      '&[data-side="bottom"]': { top: '-9px' },
      '&[data-side="left"]': { right: '-13px', rotate: '90deg' },
      '&[data-side="right"]': { left: '-13px', rotate: 'calc(90deg * -1)' },
      '&[data-side="top"]': { bottom: '-8px', rotate: '180deg' },
    },
  })
  export const item = style({ height: '100%' })
  export const item2 = style({
    marginLeft: 1,
    color: `color-mix(in oklab, ${theme.vars.color.gray['900']} 80%, transparent)`,
    transitionProperty: 'transform, translate, scale, rotate',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: { ':where(*[data-popup-open]) &': { rotate: '180deg' } },
  })
  export const item3 = style({ display: 'flex', flexDirection: 'column' })
  export const item4 = style({
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    borderRadius: 'md',
    paddingInline: 2,
    paddingBlock: 1,
    fontSize: '14px',
    fontWeight: 'medium',
    color: `color-mix(in oklab, ${theme.vars.color.foreground} 80%, transparent)`,
    selectors: {
      '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } },
      '&[data-v-active="true"]': {
        backgroundColor: theme.vars.color.blue['300'],
        color: theme.vars.color.blue['900'],
      },
    },
  })
  export const item5 = style({
    width: 3,
    height: 3,
    color: `color-mix(in oklab, ${theme.vars.color.gray['900']} 60%, transparent)`,
  })
  export const item6 = style({ height: '100%' })
  export const item7 = style({
    marginLeft: 1,
    width: 'calc(0.25rem * 3.5)',
    height: 'calc(0.25rem * 3.5)',
    color: `color-mix(in oklab, ${theme.vars.color.gray['900']} 60%, transparent)`,
  })
  export const element = style({
    display: 'flex',
    height: '100%',
    cursor: 'pointer',
    alignItems: 'center',
    borderBottomStyle: 'solid',
    borderBottomWidth: '2px',
    borderColor: 'transparent',
    paddingInline: 2,
    fontSize: '14px',
    fontWeight: 'medium',
    color: `color-mix(in oklab, ${theme.vars.color.foreground} 80%, transparent)`,
    selectors: {
      '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } },
      '&[data-v-active="true"]': {
        borderColor: theme.vars.color.blue['700'],
        color: theme.vars.color.blue['600'],
      },
    },
  })
  export const arrowSvg = style({ fill: theme.vars.color.surface })
  export const arrowSvg2 = style({ fill: theme.vars.color.gray['400'] })
}

export function TopNav(props: TopNav.Props) {
  const { className } = props

  const { topNav } = useConfig()
  const { path } = useRouter()

  const items = React.useMemo(() => TopNav_core.parse(topNav, path), [topNav, path])

  return (
    <NavigationMenu.Root className={cx(styles.topNav().className, className)}>
      <NavigationMenu.List aria-orientation={undefined} className={styles.topNav2().className}>
        {items.map((item, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: _
          <Item key={i} {...item} />
        ))}
      </NavigationMenu.List>

      <NavigationMenu.Portal>
        <NavigationMenu.Positioner
          side="bottom"
          sideOffset={-8}
          className={styles.topNav3().className}
        >
          <NavigationMenu.Popup className={styles.topNav4().className}>
            <NavigationMenu.Arrow className={styles.topNav5().className}>
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
      <NavigationMenu.Item className={styles.item().className}>
        <NavigationMenu.Trigger className={Item.className} data-v-active={active}>
          {text}
          <NavigationMenu.Icon>
            <LucideChevronDown className={styles.item2().className} />
          </NavigationMenu.Icon>
        </NavigationMenu.Trigger>
        <NavigationMenu.Content className={styles.item3().className}>
          {items.map((item, i) => {
            const itemIsExternal = item.external ?? Path.isExternal(item.link)
            return (
              <NavigationMenu.Link
                className={styles.item4().className}
                data-v-active={item.active}
                // biome-ignore lint/suspicious/noArrayIndexKey: _
                key={i}
                // @ts-expect-error
                // biome-ignore lint/style/noNonNullAssertion: _
                render={<Link to={item.link!} />}
              >
                {item.text}
                {itemIsExternal && <LucideArrowUpRight className={styles.item5().className} />}
              </NavigationMenu.Link>
            )
          })}
        </NavigationMenu.Content>
      </NavigationMenu.Item>
    )

  if (!link) return null

  return (
    <NavigationMenu.Item className={styles.item6().className}>
      <NavigationMenu.Link
        className={Item.className}
        data-v-active={active}
        // @ts-expect-error
        render={<Link to={link} />}
      >
        {text}
        {isExternal && <LucideArrowUpRight className={styles.item7().className} />}
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

  export const className = styles.element().className
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none" {...props}>
      <title>Arrow</title>
      <path
        {...styles.arrowSvg()}
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
      />
      <path
        {...styles.arrowSvg2()}
        d="M10.3333 3.34539L5.47654 7.71648C4.55842 8.54279 3.36693 9 2.13172 9H0V8H2.13172C3.11989 8 4.07308 7.63423 4.80758 6.97318L9.66437 2.60207C10.0447 2.25979 10.622 2.2598 11.0023 2.60207L15.8591 6.97318C16.5936 7.63423 17.5468 8 18.5349 8H20V9H18.5349C17.2998 9 16.1083 8.54278 15.1901 7.71648L10.3333 3.34539Z"
      />
    </svg>
  )
}
