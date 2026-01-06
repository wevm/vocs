'use client'

import type * as React from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import LucideAlertTriangle from '~icons/lucide/alert-triangle'

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

  return (
    <div
      className="vocs:flex vocs:flex-col vocs:items-center vocs:justify-center vocs:min-h-[60vh] vocs:px-6 vocs:py-16 vocs:text-center"
      data-v-error
    >
      <div
        className="vocs:flex vocs:items-center vocs:justify-center vocs:size-20 vocs:rounded-full vocs:bg-surface vocs:border vocs:border-primary vocs:text-secondary vocs:mb-6"
        data-v-error-icon
      >
        <LucideAlertTriangle className="vocs:size-10" />
      </div>

      <h1
        className="vocs:text-heading vocs:text-h1 vocs:font-medium vocs:tracking-[-0.04em] vocs:leading-h1 vocs:mb-3"
        data-v-error-title
      >
        Something went wrong
      </h1>

      <p
        className="vocs:text-secondary vocs:leading-p vocs:tracking-normal vocs:max-w-md vocs:mb-4"
        data-v-error-description
      >
        An unexpected error occurred.
      </p>

      {error && (
        <pre
          className="vocs:text-sm vocs:text-secondary vocs:bg-surface vocs:border vocs:border-primary vocs:rounded-lg vocs:px-4 vocs:py-3 vocs:w-[768px] vocs:max-w-full vocs:h-[400px] vocs:overflow-auto"
          data-v-error-message
        >
          {error.message}
        </pre>
      )}
    </div>
  )
}

declare namespace Fallback {
  type Props = {
    error: Error
  }
}
