'use client'

import * as React from 'react'
import { cx } from 'zyzz'
import LucideSearch from '~icons/lucide/search'
import { style, vars } from '../styles/zyzz.config.js'
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
  export const logoGutter = style({
    position: 'fixed',
    zIndex: 20,
    display: 'flex',
    height: 'topNav',
    width: 'logo',
    minWidth: 'fit-content !custom',
    justifyContent: 'flex-end',
    '@media (width < 1080px)': {
      display: 'none',
      width: 'fit-content !custom',
    },
  })

  export const logoSlot = style({
    width: 'sidebar',
    minWidth: 'fit-content !custom',
    paddingInline: 'sidebar-px',
    paddingBlock: '3',
  })

  export const logoLink = style({
    display: 'flex',
    height: '100% !custom',
    width: 'fit-content !custom',
  })

  export const leftGutter = style({
    position: 'fixed',
    zIndex: 10,
    display: 'flex',
    height: '100vh !custom',
    width: 'gutter',
    justifyContent: 'flex-end',
    backgroundColor: 'primary',
    '@media (width < 1080px)': {
      display: 'none',
    },
  })

  export const sidebarContainer = style({
    display: 'flex',
    height: '100% !custom',
    width: 'sidebar',
    flexDirection: 'column',
    justifyContent: 'space-between',
    overflowY: 'auto',
    paddingInline: 'sidebar-px',
    paddingBlock: 'sidebar-py',
  })

  export const sidebarCurtain = style({
    position: 'sticky',
    top: '0',
    minHeight: '4',
    width: '100% !custom',
    '@supports (background-image: linear-gradient(in lab, red, red))': {},
    backgroundImage: 'linear-gradient(to top in oklab, transparent 0%, #0000 100%)',
  })

  export const sidebarHeader = style({
    marginBottom: '4',
  })

  export const sidebar = style({
    paddingBottom: '8',
    selectors: {
      '&>*:first-child>[data-empty]': {
        height: '0',
      },
    },
  })

  export const sidebarFooter = style({
    position: 'sticky',
    bottom: '0',
  })

  export const sidebarFooterCurtain = style({
    position: 'sticky',
    bottom: '0',
    minHeight: '4',
    width: '100% !custom',
    '@supports (background-image: linear-gradient(in lab, red, red))': {},
    backgroundImage: `linear-gradient(to bottom, transparent 0%, ${vars.backgroundColor.primary} 100%)`,
  })

  export const sidebarFooterContent = style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'primary',
    paddingBottom: '2',
  })

  export const topGutter = style({
    position: 'fixed',
    display: 'flex',
    height: 'topNav',
    justifyContent: 'space-between',
    backgroundColor: 'primary',
    paddingInline: '4',
    '@media (width < 1080px)': {
      left: '0',
      width: '100% !custom',
      paddingRight: '0',
    },
    '@media (width < 748px)': {
      borderBottomStyle: 'solid',
      borderBottomWidth: '1px',
      borderColor: 'primary',
    },
  })

  export const topGutterLogo = style({
    display: 'flex',
    height: '100% !custom',
    gap: '2',
    paddingBlock: '2',
  })

  export const mobileLogoLink = style({
    display: 'flex',
    paddingBlock: 'half',
  })

  export const topNavSpacer = style({
    width: '1',
  })

  export const themeToggle = style({
    width: '240px !custom',
    '@media (width < 1080px)': {
      width: '180px !custom',
    },
    '@media (width < 748px)': {
      display: 'none',
    },
  })

  export const topNav = style({
    paddingInline: '2',
    '@media (width < 1080px)': {
      display: 'none',
    },
  })

  export const mobileActions = style({
    display: 'flex',
    alignItems: 'center',
    gap: '1',
    paddingInline: '3',
    '@media (width >= 1080px)': {
      display: 'none',
    },
  })

  export const searchTrigger = style({
    display: 'flex',
    width: '8',
    height: '8',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (width >= 748px)': {
      display: 'none',
    },
  })

  export const surfaceBackground = style({
    position: 'fixed',
    marginLeft: 'gutter',
    height: '100% !custom',
    width: '100% !custom',
    maxWidth: '100vw !custom',
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    '@media (width < 1080px)': {
      width: '100% !custom',
    },
    '@media (width < 748px)': {
      display: 'none',
    },
    '@media (width >= 1080px)': {
      borderLeftStyle: 'solid',
      borderLeftWidth: '1px',
    },
  })

  export const blankMain = style({
    paddingBottom: '0',
  })

  export const mainLayout = style({
    paddingBottom: '20',
  })

  export const fullWidthContent = style({
    maxWidth: 'none !custom',
  })

  export const standardContent = style({
    maxWidth: 'content',
  })

  export const contentFooter = style({
    marginTop: '8',
  })

  export const pageMeta = style({
    marginBottom: '4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2',
    '@media (width < 40rem)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  })

  export const pagination = style({
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    borderColor: 'primary',
    paddingTop: '8',
  })

  export const askAiContainer = style({
    position: 'fixed',
    bottom: '6',
    left: 'calc(1 / 2 * 100%) !custom',
    zIndex: 40,
    translate: 'calc(calc(1 / 2 * 100%) * -1) 0 !custom',
    willChange: 'transform',
    '@media (width < 748px)': {
      bottom: '2',
    },
  })

  export const askAi = style({
    zIndex: '50 !important',
    height: `calc(${vars.spacing.unit} * 10) !custom !important`,
    width: '290px !custom !important',
    backgroundColor: 'surfaceTint !important',
    '@supports (color: color-mix(in lab, red, red))': {
      backgroundColor: `color-mix(in oklab, ${vars.backgroundColor.surfaceTint} 20%, transparent) !custom !important`,
    },
    WebkitBackdropFilter: `blur(${vars.blur.md}) !important`,
    backdropFilter: `blur(${vars.blur.md}) !important`,
  })

  export const mobileFooter = style({
    marginBottom: '6',
    '@media (width >= 1376px)': {
      display: 'none',
    },
  })

  export const mobileCopyForAi = style({
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    paddingInline: '3',
    paddingBlock: '2',
  })

  export const logo = style({
    display: 'flex',
    height: '100% !custom',
    alignItems: 'center',
  })

  export const logoText = style({
    fontSize: '2xl',
    lineHeight: '2xl',
    fontWeight: 'bold',
    letterSpacing: 'tight',
    color: 'heading',
  })

  export const logoImage = style({
    height: '100% !custom',
    maxHeight: '7',
  })

  export const lightLogoImage = style({
    height: '100% !custom',
    maxHeight: '7',
    selectors: {
      '&:where([style*=":dark"], [style*=":dark"] *, [style*=": dark"], [style*=": dark"] *)': {
        display: 'none',
      },
    },
  })

  export const darkLogoImage = style({
    display: 'none',
    height: '100% !custom',
    maxHeight: '7',
    selectors: {
      '&:where([style*=":dark"], [style*=":dark"] *, [style*=": dark"], [style*=": dark"] *)': {
        display: 'block',
      },
    },
  })

  export const main = style({
    isolation: 'isolate',
    height: '100% !custom',
    maxWidth: '100vw !custom',
  })

  export const content = style({
    position: 'relative',
    width: '100% !custom',
    paddingInline: 'content-px',
    paddingBlock: 'content-py',
    '@media (width < 748px)': {
      overflowX: 'hidden',
    },
    selectors: {
      ':where(& > :not(:last-child))': {
        marginBlockStart: '0 !custom',
        marginBlockEnd: '6',
      },
    },
  })

  export const footer = style({
    width: '100% !custom',
    paddingInline: 'content-px',
    paddingBottom: '12',
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
        <div {...styles.logoGutter()} data-v-gutter-logo>
          <div {...styles.logoSlot()} data-v-logo>
            <Link {...styles.logoLink()} to="/" unstable_prefetchOnView={false}>
              <Logo />
            </Link>
          </div>
        </div>
      )}

      {showSidebar && (
        <div {...styles.leftGutter()} data-v-gutter-left>
          <aside {...styles.sidebarContainer()} data-v-sidebar-container ref={sidebarScrollRef}>
            <div {...styles.sidebarCurtain()} data-v-sidebar-curtain />

            {SidebarHeader && (
              <div {...styles.sidebarHeader()} data-v-sidebar-header>
                <SidebarHeader />
              </div>
            )}

            <Sidebar.Sidebar {...styles.sidebar()} scrollRef={sidebarScrollRef} />

            <div {...styles.sidebarFooter()} data-v-sidebar-footer>
              <div {...styles.sidebarFooterCurtain()} data-v-sidebar-footer-curtain />
              <div {...styles.sidebarFooterContent()} data-v-sidebar-footer-content>
                <Socials.Socials />
                {showThemeToggle && <ThemeToggle.ThemeToggle />}
              </div>
            </div>
          </aside>
        </div>
      )}

      {showTopNav && (
        <div ref={topGutterRef} {...styles.topGutter()} data-v-gutter-top>
          <div {...styles.topGutterLogo()} data-v-gutter-top-left>
            {showLogo && (
              <Link
                {...styles.mobileLogoLink()}
                data-v-logo-link
                to="/"
                unstable_prefetchOnView={false}
              >
                <Logo />
              </Link>
            )}

            <div {...styles.topNavSpacer()} />

            {showSearch && (
              <div {...styles.themeToggle()}>
                <Search.Search />
              </div>
            )}
          </div>

          <TopNav.TopNav {...styles.topNav()} />

          <div {...styles.mobileActions()}>
            {showSearch && (
              <Search.Search
                disableKeyboardShortcut
                trigger={
                  <button aria-label="Search" {...styles.searchTrigger()} type="button">
                    <LucideSearch />
                  </button>
                }
              />
            )}

            <MobileNav.MobileNav />
          </div>
        </div>
      )}

      {showSidebar && <div {...styles.surfaceBackground()} data-v-surface-bg />}

      <main
        {...cx(
          styles.main(),
          layout === 'blank' && styles.blankMain(),
          !(layout === 'blank') && styles.mainLayout(),
        )}
        data-v-main
        id="vocs-content"
      >
        {showOutline && <Outline.Outline footer={OutlineFooter} />}

        <article
          {...cx(
            styles.content(),
            contentWidth === 'full' && styles.fullWidthContent(),
            !(contentWidth === 'full') && styles.standardContent(),
          )}
          data-v-content
        >
          {children}

          {layout === 'full' && (
            <div {...styles.contentFooter()} data-v-content-footer>
              <MobileFeedback />

              <div {...styles.pageMeta()}>
                <EditLink.EditLink />
                <LastUpdated.LastUpdated />
              </div>

              <MobileCopyForAi />

              <div {...styles.pagination()}>
                <Pagination.Pagination />
              </div>
            </div>
          )}
        </article>

        {Footer && (
          <footer
            {...cx(
              styles.footer(),
              contentWidth === 'full' && styles.fullWidthContent(),
              !(contentWidth === 'full') && styles.standardContent(),
            )}
            data-v-footer
          >
            <Footer />
          </footer>
        )}
      </main>

      {showAskAi && (
        <div {...styles.askAiContainer()} data-v-ask-ai-container>
          <AskAi.AskAi {...styles.askAi()} />
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
    <div {...styles.mobileFooter()}>
      <Feedback.Feedback frontmatter={frontmatter} />
    </div>
  )
}

function MobileCopyForAi() {
  const { frontmatter } = MdxPageContext.use()
  return (
    <div {...styles.mobileFooter()}>
      <CopyForAi.CopyForAi {...styles.mobileCopyForAi()} frontmatter={frontmatter} />
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
            <div {...styles.logoText()} data-v-logo-text>
              {title}
            </div>
          )
        if (typeof logoUrl === 'string')
          return <img alt="Logo" {...styles.logoImage()} data-v-logo-image src={logoUrl} />
        return (
          <>
            <img alt="Logo" {...styles.lightLogoImage()} data-v-logo-image src={logoUrl.light} />
            <img alt="Logo" {...styles.darkLogoImage()} data-v-logo-image src={logoUrl.dark} />
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
