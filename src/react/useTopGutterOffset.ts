import * as React from 'react'

const maxWidth = 748
const maxOffset = 48
const lerpFactor = 0.5

function lerp(current: number, target: number): number {
  return current + (target - current) * lerpFactor
}

type Listener = (offset: number) => void

const state = {
  animating: false,
  currentOffset: 0,
  initialized: false,
  lastScrollY: 0,
  listeners: new Set<Listener>(),
  targetOffset: 0,
}

function hasBanner(): boolean {
  const bannerHeight = getComputedStyle(document.documentElement).getPropertyValue(
    '--vocs-spacing-banner',
  )
  return Boolean(bannerHeight && bannerHeight !== '0px')
}

function notify() {
  for (const listener of state.listeners) listener(state.currentOffset)
}

function animate() {
  state.currentOffset = lerp(state.currentOffset, state.targetOffset)

  if (Math.abs(state.currentOffset - state.targetOffset) < 0.5) {
    state.currentOffset = state.targetOffset
    state.animating = false
  } else {
    requestAnimationFrame(animate)
  }

  notify()
}

function onScroll() {
  if (window.innerWidth > maxWidth) {
    if (state.currentOffset !== 0) {
      state.currentOffset = 0
      state.targetOffset = 0
      notify()
    }
    return
  }

  if (hasBanner()) return

  const scrollY = window.scrollY

  if (scrollY < 0) {
    state.lastScrollY = 0
    return
  }

  const diff = scrollY - state.lastScrollY
  state.lastScrollY = scrollY

  if (diff === 0) return

  state.targetOffset = Math.max(0, Math.min(state.targetOffset + diff, maxOffset))

  if (!state.animating) {
    state.animating = true
    requestAnimationFrame(animate)
  }
}

function init() {
  if (state.initialized) return
  state.initialized = true
  state.lastScrollY = window.scrollY
  window.addEventListener('scroll', onScroll, { passive: true })
}

export function useTopGutterOffset(): number {
  const [offset, setOffset] = React.useState(0)

  React.useEffect(() => {
    init()
    state.listeners.add(setOffset)
    setOffset(state.currentOffset)
    return () => {
      state.listeners.delete(setOffset)
    }
  }, [])

  return offset
}

export function useTopGutterRef(): React.RefCallback<HTMLElement> {
  return React.useCallback((element: HTMLElement | null) => {
    if (!element) return

    init()

    element.style.willChange = 'transform, opacity'

    const update = (offset: number) => {
      const opacity = 1 - offset / maxOffset
      element.style.transform = `translate3d(0, -${offset}px, 0)`
      element.style.opacity = String(opacity)
      element.style.visibility = opacity < 0.1 ? 'hidden' : 'visible'
    }

    update(state.currentOffset)
    state.listeners.add(update)

    return () => {
      state.listeners.delete(update)
    }
  }, [])
}
