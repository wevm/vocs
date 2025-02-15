import clsx from 'clsx'
import type * as React from 'react'
import { Button } from 'vocs/components'

type ButtonProps = {
  children: React.ReactNode
  className?: string
  href?: string
  variant?: 'accent'
}

export function Large({ children, className, ...rest }: ButtonProps) {
  return (
    <Button className={clsx('text-xl', className)} {...rest}>
      {children}
    </Button>
  )
}
