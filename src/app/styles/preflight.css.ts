import { layer } from '@vanilla-extract/css'

// Preflight layer designed to be used by consumers so
// consumer styles don't override internal Vocs styles.
// Example case: @tailwind CSS directives.
layer()
