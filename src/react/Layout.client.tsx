'use client'

import { cx } from 'cva'
import * as React from 'react'
import { Link } from 'waku'
import * as AskAi from './internal/AskAi.js'
import * as Search from './internal/Search.js'
import * as Sidebar from './internal/Sidebar.js'
import * as TopNav from './internal/TopNav.js'
import { useConfig } from './useConfig.js'
import { useScrollDirection } from './useScrollDirection.js'

export function Main(props: Main.Props) {
  const { children } = props

  const sidebarScrollRef = React.useRef<HTMLDivElement>(null)
  const scrollDirection = useScrollDirection({ deltaY: 200 })

  return (
    <div>
      <div
        className="vocs:flex vocs:max-lg:hidden vocs:justify-end vocs:fixed vocs:h-topNav vocs:w-logo vocs:min-w-fit vocs:max-lg:w-fit vocs:z-20"
        data-v-gutter-logo
      >
        <div className="vocs:w-sidebar vocs:px-sidebar-px vocs:py-3 vocs:min-w-fit" data-v-logo>
          <Link to="/">
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

          {/* <div className="vocs:sticky vocs:bottom-0" data-v-sidebar-footer>
            <div
              className="vocs:bg-linear-to-b vocs:from-transparent vocs:to-dark vocs:min-h-4 vocs:bottom-0 vocs:w-full vocs:sticky"
              data-v-sidebar-footer-curtain
            />
            <div className="vocs:bg-primary" data-v-sidebar-footer>
              TODO
            </div>
          </div> */}
        </aside>
      </div>

      <div
        className={cx(
          'vocs:bg-primary vocs:fixed vocs:flex vocs:justify-between vocs:lg:left-gutter vocs:w-[calc(100vw-var(--vocs-spacing-gutter))] vocs:pr-[calc(var(--vocs-spacing-gutter)-var(--vocs-spacing-sidebar)-(var(--vocs-spacing)*4))] vocs:h-topNav vocs:px-4 vocs:z-10 vocs:max-lg:w-full vocs:max-lg:left-0 vocs:max-lg:pr-0 vocs:max-lg:transition-transform vocs:max-lg:duration-300 vocs:max-lg:will-change-transform vocs:max-md:border-b vocs:max-md:border-primary',
          scrollDirection === 'down' && 'vocs:max-md:-translate-y-full',
        )}
        data-v-gutter-top
      >
        <div className="vocs:flex vocs:gap-2 vocs:h-full vocs:py-2 vocs:lg:-ml-7">
          <Link className="vocs:lg:hidden vocs:py-0.5" to="/">
            <Logo />
          </Link>

          <div className="vocs:w-1" />

          <div className="vocs:max-lg:w-[180px] vocs:w-[240px] vocs:max-md:hidden">
            <Search.Search />
          </div>

          <div className="vocs:w-[120px] vocs:max-lg:hidden">
            <AskAi.AskAi />
          </div>
        </div>

        <TopNav.TopNav className="vocs:max-md:hidden vocs:px-2" />
      </div>

      <div className="vocs:fixed vocs:bg-surface vocs:lg:rounded-tl-2xl vocs:lg:border-l vocs:border-t vocs:border-primary vocs:w-[calc(100vw-var(--vocs-spacing-gutter))] vocs:h-full vocs:max-lg:w-full vocs:top-topNav vocs:max-md:top-0 vocs:lg:translate-x-gutter" />

      <main className="vocs:isolate vocs:pt-topNav vocs:w-full vocs:h-full" data-v-main>
        <article
          className="vocs:min-[1402px]:mx-auto vocs:max-[1402px]:translate-x-gutter vocs:max-lg:translate-x-0 vocs:px-content-px vocs:py-content-py vocs:relative vocs:w-full vocs:max-w-content vocs:space-y-6 vocs:max-md:overflow-x-hidden vocs:max-lg:mx-auto"
          data-v-content
        >
          {children}
        </article>
      </main>

      <div
        className="vocs:fixed vocs:w-gutter vocs:h-full vocs:right-0 vocs:top-topNav vocs:z-10"
        data-v-gutter-right
      >
        {/* TODO */}
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
