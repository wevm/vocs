'use client'

import * as React from 'react'
import { Link } from 'waku'
import * as AskAi from './internal/AskAi.js'
import * as Search from './internal/Search.js'
import * as Sidebar from './internal/Sidebar.js'
import * as TopNav from './internal/TopNav.js'
import { useConfig } from './useConfig.js'

// TODO:
// - outline
// - mobile nav menus
// - prev/next pagination
// - suggest changes
// - last updated date
// - skip to content
// - socials
// - light/dark toggle
// - user "slots"

export function Main(props: Main.Props) {
  const { children } = props

  const sidebarScrollRef = React.useRef<HTMLDivElement>(null)
  const topGutterRef = useTopGutterVisibility(48)

  return (
    <div>
      <div
        className="vocs:flex vocs:max-lg:hidden vocs:justify-end vocs:fixed vocs:h-topNav vocs:w-logo vocs:min-w-fit vocs:max-lg:w-fit vocs:z-20"
        data-v-gutter-logo
      >
        <div className="vocs:w-sidebar vocs:px-sidebar-px vocs:py-3 vocs:min-w-fit" data-v-logo>
          <Link to="/" unstable_prefetchOnView>
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
        ref={topGutterRef}
        className="vocs:bg-primary vocs:fixed vocs:flex vocs:justify-between vocs:lg:left-gutter vocs:w-[calc(100vw-var(--vocs-spacing-gutter))] vocs:pr-[calc(var(--vocs-spacing-gutter)-var(--vocs-spacing-sidebar)-(var(--vocs-spacing)*4))] vocs:h-topNav vocs:px-4 vocs:z-10 vocs:max-lg:w-full vocs:max-lg:left-0 vocs:max-lg:pr-0 vocs:max-md:border-b vocs:max-md:border-primary"
        data-v-gutter-top
      >
        <div className="vocs:flex vocs:gap-2 vocs:h-full vocs:py-2 vocs:lg:-ml-7">
          <Link className="vocs:lg:hidden vocs:py-0.5" to="/" unstable_prefetchOnView>
            <Logo />
          </Link>

          <div className="vocs:w-1" />

          <div className="vocs:max-lg:w-[180px] vocs:w-[240px] vocs:max-md:hidden">
            <Search.Search />
          </div>
        </div>

        <TopNav.TopNav className="vocs:max-lg:hidden vocs:px-2" />

        {/* <div className="vocs:lg:hidden vocs:flex vocs:items-center vocs:gap-2 vocs:px-4">TODO</div> */}
      </div>

      <div className="vocs:max-md:hidden vocs:fixed vocs:bg-surface vocs:lg:rounded-tl-2xl vocs:lg:border-l vocs:border-t vocs:border-primary vocs:w-full vocs:h-full vocs:max-lg:w-full vocs:top-topNav vocs:max-w-screen vocs:ml-gutter" />

      <main
        className="vocs:isolate vocs:pt-topNav vocs:pb-20 vocs:max-w-screen vocs:h-full vocs:lg:ml-gutter"
        data-v-main
      >
        <article
          className="vocs:px-content-px vocs:py-content-py vocs:relative vocs:w-full vocs:max-w-content vocs:space-y-6 vocs:max-md:overflow-x-hidden vocs:max-lg:mx-auto"
          data-v-content
        >
          {children}
        </article>
      </main>

      <div
        className="vocs:fixed vocs:bottom-6 vocs:max-md:bottom-2 vocs:w-full vocs:flex vocs:justify-center"
        data-v-ask-ai-container
      >
        <AskAi.AskAi className="vocs:w-[290px]! vocs:h-10! vocs:z-50! vocs:bg-surfaceTint/20! vocs:backdrop-blur-md!" />
      </div>

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

export function useTopGutterVisibility(maxOffset: number): React.RefCallback<HTMLElement> {
  const state = React.useRef({
    animating: false,
    cleanup: null as (() => void) | null,
    currentOffset: 0,
    lastScrollY: 0,
    targetOffset: 0,
  })

  return React.useCallback(
    (element: HTMLElement | null) => {
      // Cleanup previous listener
      state.current.cleanup?.()
      state.current.cleanup = null

      if (!element) return
      if (window.innerWidth > useTopGutterVisibility.maxWidth) return

      element.style.willChange = 'transform, opacity'

      const s = state.current
      s.lastScrollY = window.scrollY
      s.targetOffset = 0
      s.currentOffset = 0
      s.animating = false

      const animate = () => {
        s.currentOffset = useTopGutterVisibility.lerp(s.currentOffset, s.targetOffset)

        if (Math.abs(s.currentOffset - s.targetOffset) < 0.5) {
          s.currentOffset = s.targetOffset
          s.animating = false
        } else {
          requestAnimationFrame(animate)
        }

        const opacity = 1 - s.currentOffset / maxOffset
        element.style.cssText = `
          will-change: transform, opacity;
          transform: translate3d(0, -${s.currentOffset}px, 0);
          opacity: ${opacity};
          visibility: ${opacity < 0.1 ? 'hidden' : 'visible'};
        `
      }

      const onScroll = () => {
        const scrollY = window.scrollY

        if (scrollY < 0) {
          s.lastScrollY = 0
          return
        }

        const diff = scrollY - s.lastScrollY
        s.lastScrollY = scrollY

        if (diff === 0) return

        s.targetOffset = Math.max(0, Math.min(s.targetOffset + diff, maxOffset))

        if (!s.animating) {
          s.animating = true
          requestAnimationFrame(animate)
        }
      }

      window.addEventListener('scroll', onScroll, { passive: true })
      s.cleanup = () => window.removeEventListener('scroll', onScroll)
    },
    [maxOffset],
  )
}

export namespace useTopGutterVisibility {
  export type Props = {
    maxOffset: number
  }

  export const maxWidth = 748
  export const lerpFactor = 0.5

  export function lerp(current: number, target: number): number {
    return current + (target - current) * lerpFactor
  }
}
