'use client'

import * as React from 'react'
import type { Frontmatter } from '../internal/config.js'

export type Data = {
  frontmatter: Frontmatter | undefined
}

const MdxPageContext = React.createContext<Data>({
  frontmatter: undefined,
})

export function Provider(props: Provider.Props) {
  const { children, frontmatter } = props
  return <MdxPageContext.Provider value={{ frontmatter }}>{children}</MdxPageContext.Provider>
}

export declare namespace Provider {
  export type Props = {
    children: React.ReactNode
    frontmatter: Frontmatter | undefined
  }
}

export function use() {
  return React.useContext(MdxPageContext)
}
