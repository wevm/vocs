import type * as React from 'react'

export function Benchmarks(props: Benchmarks.Props) {
  const { children, legend, scalar: _scalar, ...rest } = props
  return (
    <div {...rest} data-v data-v-benchmarks>
      {children}
      {legend !== 'false' && (
        <footer data-v-benchmarks-legend>
          <span>Faster</span>
          <span data-v-benchmarks-legend-scale />
          <span>Slower</span>
          <span data-v-benchmarks-legend-baseline>
            <span data-v-benchmarks-legend-swatch />
            baseline
          </span>
        </footer>
      )}
    </div>
  )
}

export declare namespace Benchmarks {
  type Props = React.PropsWithChildren<
    React.ComponentProps<'div'> & {
      legend?: string | undefined
      scalar?: string | undefined
    }
  >
}
