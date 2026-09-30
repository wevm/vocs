'use client'

import type * as React from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import LucideAlertTriangle from '~icons/lucide/alert-triangle'
import { style, vars } from '../../styles/zyzz.config.js'

namespace styles {
  export const root = style({
    display: 'flex',
    minHeight: '60vh !custom',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingInline: '6',
    paddingBlock: '16',
    textAlign: 'center',
  })

  export const iconContainer = style({
    marginBottom: '6',
    display: 'flex',
    width: '20',
    height: '20',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'calc(infinity * 1px) !custom',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    color: 'secondary',
  })

  export const icon = style({
    width: '10',
    height: '10',
  })

  export const title = style({
    marginBottom: '3',
    fontSize: 'h1',
    lineHeight: vars.layout.leadingH1,
    fontWeight: 'medium',
    letterSpacing: '-0.04em !custom',
    color: 'heading',
  })

  export const description = style({
    marginBottom: '4',
    maxWidth: 'md',
    lineHeight: vars.layout.leadingP,
    letterSpacing: 'normal',
    color: 'secondary',
  })

  export const message = style({
    height: '400px !custom',
    width: '768px !custom',
    maxWidth: '100% !custom',
    overflow: 'auto',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'surface',
    paddingInline: '4',
    paddingBlock: '3',
    fontSize: 'sm',
    lineHeight: 'sm',
    color: 'secondary',
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
    <div {...styles.root()} data-v-error>
      <div {...styles.iconContainer()} data-v-error-icon>
        <LucideAlertTriangle {...styles.icon()} />
      </div>

      <h1 {...styles.title()} data-v-error-title>
        Something went wrong
      </h1>

      <p {...styles.description()} data-v-error-description>
        An unexpected error occurred.
      </p>

      {message && (
        <pre {...styles.message()} data-v-error-message>
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
