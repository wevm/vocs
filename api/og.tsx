import { ImageResponse } from '@vercel/og'
import * as React from 'react'

export const config = {
  runtime: 'edge',
}

export default async function handler(request: Request) {
  const { searchParams } = new URL(request.url)

  const logo = searchParams.get('logo')
  const title = searchParams.get('title')
  const description = searchParams.get('description')

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: '#232225',
        color: 'white',
        padding: '80px',
      }}
    >
      {/* biome-ignore lint/a11y/useAltText: */}
      {logo && <img src={logo} height="40px" />}
      <div style={{ fontSize: '32px', fontWeight: 'bold', marginTop: 48 }}>{title}</div>
      {description && (
        <div style={{ opacity: 0.8, fontSize: '24px', marginTop: 12 }}>{description}</div>
      )}
    </div>,
    {
      width: 800,
      height: 400,
    },
  )
}
