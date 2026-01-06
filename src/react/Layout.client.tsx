'use client'

import * as React from 'react'
import { Link } from 'waku'
import LucideSearch from '~icons/lucide/search'

import * as AskAi from './internal/AskAi.js'
import * as EditLink from './internal/EditLink.client.js'
import * as LastUpdated from './internal/LastUpdated.client.js'
import * as MobileNav from './internal/MobileNav.js'
import * as Outline from './internal/Outline.js'
import * as Pagination from './internal/Pagination.client.js'
import * as Search from './internal/Search.js'
import * as Sidebar from './internal/Sidebar.js'
import * as SkipToContent from './internal/SkipToContent.client.js'
import * as ThemeToggle from './internal/ThemeToggle.client.js'
import * as TopNav from './internal/TopNav.js'
import { useConfig } from './useConfig.js'
import { useTopGutterVisibility } from './useTopGutterVisibility.js'

// TODO:
// - socials
// - user "slots"

export function Main(props: Main.Props) {
  const { children } = props

  const sidebarScrollRef = React.useRef<HTMLDivElement>(null)
  const topGutterRef = useTopGutterVisibility(48)

  return (
    <div>
      <SkipToContent.SkipToContent />

      <div
        className="vocs:flex vocs:max-lg:hidden vocs:justify-end vocs:fixed vocs:h-topNav vocs:w-logo vocs:min-w-fit vocs:max-lg:w-fit vocs:z-20"
        data-v-gutter-logo
      >
        <div className="vocs:w-sidebar vocs:px-sidebar-px vocs:py-3 vocs:min-w-fit" data-v-logo>
          <Link className="vocs:flex vocs:h-full vocs:w-fit" to="/" unstable_prefetchOnView>
            <Logo />
          </Link>
        </div>
      </div>

      <div
        className="vocs:bg-primary vocs:flex vocs:justify-end vocs:fixed vocs:pt-topNav vocs:w-gutter vocs:h-screen vocs:z-10 vocs:max-lg:hidden"
        data-v-gutter-left
      >
        <aside
          className="vocs:w-sidebar vocs:px-sidebar-px vocs:py-sidebar-py vocs:h-full vocs:flex vocs:flex-col vocs:justify-between vocs:overflow-y-auto"
          data-v-sidebar-container
          ref={sidebarScrollRef}
        >
          <div
            className="vocs:bg-linear-to-t vocs:from-transparent vocs:to-dark vocs:min-h-4 vocs:top-0 vocs:w-full vocs:sticky"
            data-v-sidebar-curtain
          />

          <Sidebar.Sidebar
            className="vocs:pb-8 vocs:[&>*:first-child>[data-empty]]:h-0"
            scrollRef={sidebarScrollRef}
          />

          <div className="vocs:sticky vocs:bottom-0" data-v-sidebar-footer>
            <div
              className="vocs:bg-linear-to-b vocs:from-transparent vocs:to-primary vocs:min-h-4 vocs:bottom-0 vocs:w-full vocs:sticky"
              data-v-sidebar-footer-curtain
            />
            <div className="vocs:bg-primary vocs:pb-2 vocs:flex vocs:justify-end" data-v-sidebar-footer-content>
              <ThemeToggle.ThemeToggle />
            </div>
          </div>
        </aside>
      </div>

      <div
        ref={topGutterRef}
        className="vocs:bg-primary vocs:fixed vocs:flex vocs:justify-between vocs:lg:left-gutter vocs:w-[calc(100vw-var(--vocs-spacing-gutter))] vocs:pr-[calc(var(--vocs-spacing-gutter)-var(--vocs-spacing-sidebar)-(var(--vocs-spacing)*4))] vocs:h-topNav vocs:px-4 vocs:z-10 vocs:max-lg:w-full vocs:max-lg:left-0 vocs:max-lg:pr-0 vocs:max-md:border-b vocs:max-md:border-primary"
        data-v-gutter-top
      >
        <div className="vocs:flex vocs:gap-2 vocs:h-full vocs:py-2 vocs:lg:-ml-7">
          <Link className="vocs:lg:hidden vocs:py-0.5 vocs:flex" to="/" unstable_prefetchOnView>
            <Logo />
          </Link>

          <div className="vocs:w-1" />

          <div className="vocs:max-lg:w-[180px] vocs:w-[240px] vocs:max-md:hidden">
            <Search.Search />
          </div>
        </div>

        <TopNav.TopNav className="vocs:max-lg:hidden vocs:px-2" />

        <div className="vocs:lg:hidden vocs:flex vocs:items-center vocs:px-3">
          <button
            className="vocs:flex vocs:items-center vocs:justify-center vocs:cursor-pointer vocs:size-8"
            type="button"
          >
            <LucideSearch />
          </button>

          <MobileNav.MobileNav />
        </div>
      </div>

      <div className="vocs:max-md:hidden vocs:fixed vocs:bg-surface vocs:lg:rounded-tl-2xl vocs:lg:border-l vocs:border-t vocs:border-primary vocs:w-full vocs:h-full vocs:max-lg:w-full vocs:top-topNav vocs:max-w-screen vocs:ml-gutter" />

      <main
        className="vocs:isolate vocs:pt-topNav vocs:pb-20 vocs:max-w-screen vocs:h-full vocs:lg:ml-gutter"
        data-v-main
        id="vocs-content"
      >
        <article
          className="vocs:px-content-px vocs:py-content-py vocs:relative vocs:w-full vocs:max-w-content vocs:space-y-6 vocs:max-md:overflow-x-hidden vocs:max-lg:mx-auto"
          data-v-content
        >
          {children}

          <div className="vocs:mt-8 vocs:max-sm:hidden" data-v-content-footer>
            <div className="vocs:flex vocs:justify-between vocs:items-center vocs:mb-4">
              <EditLink.EditLink />
              <LastUpdated.LastUpdated />
            </div>

            <div className="vocs:border-t vocs:border-primary vocs:pt-8">
              <Pagination.Pagination />
            </div>
          </div>
        </article>
      </main>

      <div
        className="vocs:fixed vocs:bottom-6 vocs:max-md:bottom-2 vocs:w-full vocs:flex vocs:justify-center"
        data-v-ask-ai-container
      >
        <AskAi.AskAi className="vocs:w-[290px]! vocs:h-10! vocs:z-50! vocs:bg-surfaceTint/20! vocs:backdrop-blur-md!" />
      </div>

      <div
        className="vocs:fixed vocs:overflow-y-auto vocs:w-gutter vocs:py-content-py vocs:pb-20 vocs:h-full vocs:right-0 vocs:top-topNav vocs:z-10 vocs:max-[1376px]:hidden"
        data-v-gutter-right
      >
        <div className="vocs:flex vocs:flex-col vocs:gap-2" data-v-outline-container>
          <Outline.Outline />
        </div>
      </div>
    </div>
  )
}

export namespace Main {
  export type Props = {
    children: React.ReactNode
  }
}

export function Logo() {
  const { logoUrl, title } = useConfig()

  return (
    <div className="vocs:flex vocs:items-center vocs:h-full" data-v-logo>
      {(() => {
        if (!logoUrl)
          return (
            <div
              className="vocs:text-2xl vocs:text-heading vocs:tracking-tight vocs:font-bold"
              data-v-logo-text
            >
              {title}
            </div>
          )
        if (typeof logoUrl === 'string')
          return <img alt="Logo" className="vocs:h-full" data-v-logo-image src={logoUrl} />
        return (
          <>
            <img
              alt="Logo"
              className="vocs:h-full vocs:not-dark:hidden"
              data-v-logo-image
              src={logoUrl.dark}
            />
            <img
              alt="Logo"
              className="vocs:h-full vocs:dark:hidden"
              data-v-logo-image
              src={logoUrl.light}
            />
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
