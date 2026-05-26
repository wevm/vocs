'use client'

import { Footer, OutlineFooter, SidebarHeader } from 'virtual:vocs/slots'

export function useSlots() {
  return {
    Footer,
    OutlineFooter,
    SidebarHeader,
  }
}

export declare namespace useSlots {
  type ReturnType = {
    Footer: React.ComponentType | undefined
    OutlineFooter: React.ComponentType | undefined
    SidebarHeader: React.ComponentType | undefined
  }
}
