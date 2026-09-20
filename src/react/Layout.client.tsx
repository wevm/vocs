'use client'

import * as React from 'react'
import { style, theme } from 'zyzz/default'
import LucideSearch from '~icons/lucide/search'
import * as AskAi from './internal/AskAi.js'
import * as Banner from './internal/Banner.client.js'
import * as CopyForAi from './internal/CopyForAi.client.js'
import * as EditLink from './internal/EditLink.client.js'
import * as Feedback from './internal/Feedback.client.js'
import * as LastUpdated from './internal/LastUpdated.client.js'
import * as MobileNav from './internal/MobileNav.js'
import * as Outline from './internal/Outline.js'
import * as Pagination from './internal/Pagination.client.js'
import * as Search from './internal/Search.js'
import * as Sidebar from './internal/Sidebar.js'
import * as SkipToContent from './internal/SkipToContent.client.js'
import * as Socials from './internal/Socials.client.js'
import * as ThemeToggle from './internal/ThemeToggle.client.js'
import * as TopNav from './internal/TopNav.js'
import { Link } from './Link.js'
import * as MdxPageContext from './MdxPageContext.js'
import { useConfig } from './useConfig.js'
import { useLayout } from './useLayout.js'
import { useSlots } from './useSlots.js'
import { useTopGutterRef } from './useTopGutterOffset.js'

namespace styles {
  export const main = style({
    position: 'fixed',
    zIndex: 20,
    display: 'flex',
    height: 'var(--vocs-layout-topNav)',
    width: 'var(--vocs-layout-logo)',
    minWidth: 'fit-content',
    justifyContent: 'flex-end',
    '@media (width < 64rem)': { display: 'none', width: 'fit-content' },
  })
  export const main2 = style({
    width: 'var(--vocs-layout-sidebar)',
    minWidth: 'fit-content',
    paddingInline: 'var(--vocs-layout-sidebar-px)',
    paddingBlock: 3,
  })
  export const main3 = style({ display: 'flex', height: '100%', width: 'fit-content' })
  export const main4 = style({
    position: 'fixed',
    zIndex: 10,
    display: 'flex',
    height: '100vh',
    width: 'var(--vocs-layout-gutter)',
    justifyContent: 'flex-end',
    backgroundColor: theme.vars.color.background['200'],
    '@media (width < 64rem)': { display: 'none' },
  })
  export const main5 = style({
    display: 'flex',
    height: '100%',
    width: 'var(--vocs-layout-sidebar)',
    flexDirection: 'column',
    justifyContent: 'space-between',
    overflowY: 'auto',
    paddingInline: 'var(--vocs-layout-sidebar-px)',
    paddingBlock: 'var(--vocs-layout-sidebar-py)',
  })
  export const main6 = style({
    position: 'sticky',
    top: 0,
    minHeight: 4,
    width: '100%',
    '@supports (background-image: linear-gradient(in lab, red, red))': {
      backgroundImage: `linear-gradient(to top in oklab, transparent, ${theme.vars.color.background[200]})`,
    },
    backgroundImage: `linear-gradient(to top, transparent, ${theme.vars.color.background[200]})`,
  })
  export const main7 = style({ marginBottom: 4 })
  export const main8 = style({
    paddingBottom: 8,
    selectors: { '&>*:first-child>[data-empty]': { height: 0 } },
  })
  export const main9 = style({ position: 'sticky', bottom: 0 })
  export const main10 = style({
    position: 'sticky',
    bottom: 0,
    minHeight: 4,
    width: '100%',
    '@supports (background-image: linear-gradient(in lab, red, red))': {
      backgroundImage: `linear-gradient(to bottom in oklab, transparent, ${theme.vars.color.background[200]})`,
    },
    backgroundImage: `linear-gradient(to bottom, transparent, ${theme.vars.color.background[200]})`,
  })
  export const main11 = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.vars.color.background['200'],
    paddingBottom: 2,
  })
  export const main12 = style({
    position: 'fixed',
    display: 'flex',
    height: 'var(--vocs-layout-topNav)',
    justifyContent: 'space-between',
    backgroundColor: theme.vars.color.background['200'],
    paddingInline: 4,
    '@media (width < 64rem)': {
      left: 0,
      width: '100%',
      paddingRight: 0,
    },
    '@media (width < 48rem)': {
      borderBottomStyle: 'solid',
      borderBottomWidth: '1px',
      borderColor: theme.vars.color.gray['400'],
    },
  })
  export const main13 = style({
    display: 'flex',
    height: '100%',
    gap: 2,
    paddingBlock: 2,
  })
  export const main14 = style({ display: 'flex', paddingBlock: 'calc(0.25rem * 0.5)' })
  export const main15 = style({ width: 1 })
  export const main16 = style({
    width: '240px',
    '@media (width < 64rem)': { width: '180px' },
    '@media (width < 48rem)': { display: 'none' },
  })
  export const main17 = style({
    paddingInline: 2,
    '@media (width < 64rem)': { display: 'none' },
  })
  export const main18 = style({
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    paddingInline: 3,
    '@media (width >= 64rem)': { display: 'none' },
  })
  export const main19 = style({
    display: 'flex',
    width: 8,
    height: 8,
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (width >= 48rem)': { display: 'none' },
  })
  export const main20 = style({
    position: 'fixed',
    marginLeft: 'var(--vocs-layout-gutter)',
    height: '100%',
    width: '100%',
    maxWidth: '100vw',
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    '@media (width < 64rem)': { width: '100%' },
    '@media (width < 48rem)': { display: 'none' },
    '@media (width >= 64rem)': { borderLeftStyle: 'solid', borderLeftWidth: '1px' },
  })
  export const main21 = style({ isolation: 'isolate', height: '100%', maxWidth: '100vw' })
  export const main22 = style({ paddingBottom: 0 })
  export const main23 = style({ paddingBottom: 20 })
  export const main24 = style({
    position: 'relative',
    width: '100%',
    selectors: {
      ':where(& > :not(:last-child))': {
        marginBlockStart: 'calc(calc(0.25rem * 6) * 0)',
        marginBlockEnd: 'calc(calc(0.25rem * 6) * calc(1 - 0))',
      },
    },
    paddingInline: 'var(--vocs-layout-content-px)',
    paddingBlock: 'var(--vocs-layout-content-py)',
    '@media (width < 48rem)': { overflowX: 'hidden' },
  })
  export const main25 = style({ maxWidth: 'none' })
  export const main26 = style({ maxWidth: 'var(--vocs-layout-content)' })
  export const main27 = style({ marginTop: 8 })
  export const main28 = style({
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,
    '@media (width < 40rem)': { flexDirection: 'column', alignItems: 'flex-start' },
  })
  export const main29 = style({
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    paddingTop: 8,
  })
  export const main30 = style({
    width: '100%',
    paddingInline: 'var(--vocs-layout-content-px)',
    paddingBottom: 12,
  })
  export const main31 = style({ maxWidth: 'none' })
  export const main32 = style({ maxWidth: 'var(--vocs-layout-content)' })
  export const main33 = style({
    position: 'fixed',
    bottom: 6,
    left: 'calc(1 / 2 * 100%)',
    zIndex: 40,
    translate: 'calc(calc(1 / 2 * 100%) * -1) 0',
    willChange: 'transform',
    '@media (width < 48rem)': { bottom: 2 },
  })
  export const main34 = style({
    zIndex: '50 !important',
    height: 'calc(0.25rem * 10) !important',
    width: '290px !important',
    backgroundColor: `color-mix(in oklab, ${theme.vars.color.gray['100']} 20%, transparent) !important`,
    backdropFilter: 'blur(12px) !important',
  })
  export const mobileFeedback = style({
    marginBottom: 6,
    '@media (width >= 1376px)': { display: 'none' },
  })
  export const mobileCopyForAi = style({
    marginBottom: 6,
    '@media (width >= 1376px)': { display: 'none' },
  })
  export const mobileCopyForAi2 = style({
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    paddingInline: 3,
    paddingBlock: 2,
  })
  export const logo = style({ display: 'flex', height: '100%', alignItems: 'center' })
  export const logo2 = style({
    fontSize: '2xl',
    lineHeight: 'calc(2 / 1.5)',
    fontWeight: 'bold',
    letterSpacing: '-0.025em',
    color: theme.vars.color.foreground,
  })
  export const logo3 = style({ height: '100%', maxHeight: 7 })
  export const logo4 = style({
    height: '100%',
    maxHeight: 7,
    selectors: {
      '&:where([style*=":dark"], [style*=":dark"] *, [style*=": dark"], [style*=": dark"] *)': {
        display: 'none',
      },
    },
  })
  export const logo5 = style({
    display: 'none',
    height: '100%',
    maxHeight: 7,
    selectors: {
      '&:where([style*=":dark"], [style*=":dark"] *, [style*=": dark"], [style*=": dark"] *)': {
        display: 'block',
      },
    },
  })
}

export function Main(props: Main.Props) {
  const { children } = props

  const {
    layout,
    contentWidth,
    showAskAi,
    showSearch,
    showSidebar,
    showTopNav,
    showLogo,
    showOutline,
  } = useLayout()
  const { colorScheme } = useConfig()
  const { Footer, OutlineFooter, SidebarHeader } = useSlots()

  const showThemeToggle = colorScheme === 'light dark'

  const sidebarScrollRef = React.useRef<HTMLDivElement>(null)
  const topGutterRef = useTopGutterRef()

  return (
    <div
      data-layout={layout}
      data-v-content-width={contentWidth === 'full' ? 'full' : undefined}
      data-v-sidebar={showSidebar || undefined}
      data-v-topnav={showTopNav || undefined}
    >
      <Banner.Banner />

      {showTopNav && <SkipToContent.SkipToContent />}

      {showSidebar && (
        <div {...styles.main()} data-v-gutter-logo>
          <div {...styles.main2()} data-v-logo>
            <Link className={styles.main3().className} to="/">
              <Logo />
            </Link>
          </div>
        </div>
      )}

      {showSidebar && (
        <div {...styles.main4()} data-v-gutter-left>
          <aside {...styles.main5()} data-v-sidebar-container ref={sidebarScrollRef}>
            <div {...styles.main6()} data-v-sidebar-curtain />

            {SidebarHeader && (
              <div {...styles.main7()} data-v-sidebar-header>
                <SidebarHeader />
              </div>
            )}

            <Sidebar.Sidebar className={styles.main8().className} scrollRef={sidebarScrollRef} />

            <div {...styles.main9()} data-v-sidebar-footer>
              <div {...styles.main10()} data-v-sidebar-footer-curtain />
              <div {...styles.main11()} data-v-sidebar-footer-content>
                <Socials.Socials />
                {showThemeToggle && <ThemeToggle.ThemeToggle />}
              </div>
            </div>
          </aside>
        </div>
      )}

      {showTopNav && (
        <div ref={topGutterRef} {...styles.main12()} data-v-gutter-top>
          <div {...styles.main13()} data-v-gutter-top-left>
            {showLogo && (
              <Link className={styles.main14().className} data-v-logo-link to="/">
                <Logo />
              </Link>
            )}

            <div {...styles.main15()} />

            {showSearch && (
              <div {...styles.main16()}>
                <Search.Search />
              </div>
            )}
          </div>

          <TopNav.TopNav className={styles.main17().className} />

          <div {...styles.main18()}>
            {showSearch && (
              <Search.Search
                disableKeyboardShortcut
                trigger={
                  <button aria-label="Search" {...styles.main19()} type="button">
                    <LucideSearch />
                  </button>
                }
              />
            )}

            <MobileNav.MobileNav />
          </div>
        </div>
      )}

      {showSidebar && <div {...styles.main20()} data-v-surface-bg />}

      <main
        className={`${styles.main21().className} ${
          layout === 'blank' ? styles.main22().className : styles.main23().className
        }`}
        data-v-main
        id="vocs-content"
      >
        {showOutline && <Outline.Outline footer={OutlineFooter} />}

        <article
          className={`${styles.main24().className} ${
            contentWidth === 'full' ? styles.main25().className : styles.main26().className
          }`}
          data-v-content
        >
          {children}

          {layout === 'full' && (
            <div {...styles.main27()} data-v-content-footer>
              <MobileFeedback />

              <div {...styles.main28()}>
                <EditLink.EditLink />
                <LastUpdated.LastUpdated />
              </div>

              <MobileCopyForAi />

              <div {...styles.main29()}>
                <Pagination.Pagination />
              </div>
            </div>
          )}
        </article>

        {Footer && (
          <footer
            className={`${styles.main30().className} ${
              contentWidth === 'full' ? styles.main31().className : styles.main32().className
            }`}
            data-v-footer
          >
            <Footer />
          </footer>
        )}
      </main>

      {showAskAi && (
        <div {...styles.main33()} data-v-ask-ai-container>
          <AskAi.AskAi className={styles.main34().className} />
        </div>
      )}
    </div>
  )
}

export namespace Main {
  export type Props = {
    children: React.ReactNode
  }
}

function MobileFeedback() {
  const { frontmatter } = MdxPageContext.use()
  return (
    <div {...styles.mobileFeedback()}>
      <Feedback.Feedback frontmatter={frontmatter} />
    </div>
  )
}

function MobileCopyForAi() {
  const { frontmatter } = MdxPageContext.use()
  return (
    <div {...styles.mobileCopyForAi()}>
      <CopyForAi.CopyForAi
        className={styles.mobileCopyForAi2().className}
        frontmatter={frontmatter}
      />
    </div>
  )
}

export function Logo() {
  const { logoUrl, title } = useConfig()

  return (
    <div {...styles.logo()} data-v-logo>
      {(() => {
        if (!logoUrl)
          return (
            <div {...styles.logo2()} data-v-logo-text>
              {title}
            </div>
          )
        if (typeof logoUrl === 'string')
          return <img alt="Logo" {...styles.logo3()} data-v-logo-image src={logoUrl} />
        return (
          <>
            <img alt="Logo" {...styles.logo4()} data-v-logo-image src={logoUrl.light} />
            <img alt="Logo" {...styles.logo5()} data-v-logo-image src={logoUrl.dark} />
          </>
        )
      })()}
    </div>
  )
}

export namespace Logo {
  export type Props = {
    children: React.ReactNode
  }
}
