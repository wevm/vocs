'use client'

import type * as React from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { style, theme } from 'zyzz/default'
import LucideAlertTriangle from '~icons/lucide/alert-triangle'

namespace styles {
  export const fallback = style({
    display: 'flex',
    minHeight: '60vh',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: 6,
    paddingBlock: 16,
    textAlign: 'center',
  })
  export const fallback2 = style({
    marginBottom: 6,
    display: 'flex',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'calc(infinity * 1px)',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    color: theme.vars.color.gray['900'],
  })
  export const fallback3 = style({ width: 10, height: 10 })
  export const fallback4 = style({
    marginBottom: 3,
    fontSize: '4xl',
    lineHeight: '1em',
    fontWeight: 'medium',
    letterSpacing: '-0.04em',
    color: theme.vars.color.foreground,
  })
  export const fallback5 = style({
    marginBottom: 4,
    maxWidth: '28rem',
    lineHeight: '1.625em',
    letterSpacing: '0em',
    color: theme.vars.color.gray['900'],
  })
  export const fallback6 = style({
    height: '400px',
    width: '768px',
    maxWidth: '100%',
    overflow: 'auto',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.surface,
    paddingInline: 4,
    paddingBlock: 3,
    fontSize: 'sm',
    lineHeight: 'calc(1.25 / 0.875)',
    color: theme.vars.color.gray['900'],
  })
}

export function ErrorBoundary(props: ErrorBoundary.Props) {
  const { children, fallback } = props

  return (
    <ReactErrorBoundary
      FallbackComponent={fallback ? () => <>{fallback}</> : Fallback}
      onError={(error, info) => {
        console.error('ErrorBoundary caught an error:', error, info)
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}

export declare namespace ErrorBoundary {
  export type Props = {
    children: React.ReactNode
    fallback?: React.ReactNode
  }
}

// biome-ignore lint/correctness/noUnusedVariables: _
function Fallback(props: Fallback.Props) {
  const { error } = props
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : String(error)

  return (
    <div {...styles.fallback()} data-v-error>
      <div {...styles.fallback2()} data-v-error-icon>
        <LucideAlertTriangle className={styles.fallback3().className} />
      </div>

      <h1 {...styles.fallback4()} data-v-error-title>
        Something went wrong
      </h1>

      <p {...styles.fallback5()} data-v-error-description>
        An unexpected error occurred.
      </p>

      {message && (
        <pre {...styles.fallback6()} data-v-error-message>
          {message}
        </pre>
      )}
    </div>
  )
}

declare namespace Fallback {
  type Props = {
    error: unknown
  }
}
