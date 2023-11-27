import { MDXProvider } from '@mdx-js/react'
import type { ReactNode } from 'react'

export function Raw({ children }: { children: ReactNode }) {
  return <MDXProvider disableParentContext>{children}</MDXProvider>
}
