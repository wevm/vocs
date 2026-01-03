'use client'

import * as React from 'react'
import { Link } from 'waku'
import * as Sidebar from './internal/Sidebar.js'
import { useConfig } from './useConfig.js'

export function Main(props: Main.Props) {
  const { children } = props

  const sidebarScrollRef = React.useRef<HTMLDivElement>(null)

  return (
    <div>
      <div
        className="vocs:flex vocs:justify-end vocs:fixed vocs:h-topNav vocs:w-logo vocs:min-w-fit vocs:max-lg:w-fit vocs:z-20"
        data-v-gutter-logo
      >
        <div className="vocs:w-sidebar vocs:px-sidebar-px vocs:min-w-fit" data-v-logo>
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
            className="vocs:pb-8 vocs:[&>*:first-child>*:first-child]:h-0"
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
        className="vocs:bg-primary vocs:fixed vocs:flex vocs:justify-between vocs:lg:left-gutter vocs:w-[calc(100vw-var(--vocs-spacing-gutter))] vocs:pr-[calc(var(--vocs-spacing-gutter)-var(--vocs-spacing-sidebar)-(var(--vocs-spacing)*4))] vocs:h-topNav vocs:px-4 vocs:z-10"
        data-v-gutter-top
      >
        {/* TODO: <div data-v-search-container /> */}

        {/* TODO: <TopNav.TopNav /> */}
      </div>

      <div className="vocs:fixed vocs:bg-surface vocs:lg:rounded-tl-2xl vocs:lg:border-l vocs:border-t vocs:border-primary vocs:w-[calc(100vw-var(--vocs-spacing-gutter))] vocs:h-full vocs:max-lg:w-full vocs:top-topNav vocs:lg:translate-x-gutter" />

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
    <div className="vocs:flex vocs:items-center vocs:h-full vocs:py-3" data-v-logo>
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
