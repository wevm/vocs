import * as React from 'react'

export default function Custom({ children }: { children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/useButtonType: // biome-ignore lint/a11y/useButtonType: For custom demonstration purposes
    <button
      style={{
        background: 'var(--vocs-color_textAccent)',
        paddingLeft: 'var(--vocs-space_16)',
        paddingRight: 'var(--vocs-space_16)',
        borderRadius: 'var(--vocs-space_4)',
        lineHeight: 'var(--vocs-space_32)',
      }}
    >
      {children}
    </button>
  )
}
