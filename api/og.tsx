import { ImageResponse } from '@vercel/og'
import * as React from 'react'

export const config = {
  runtime: 'edge',
}

// https://og-playground.vercel.app/?share=bVLBbtswDP0VQcPQi5O4blYEQtrD2n3BCuySiyzRslpZNCQ5mRfk30c5FdYNO4l8pN6jnnjmCjVwwffaHg-esZhmBw_nc44Z68GaPgl2c1vXn2-qK3iyOvX_YNrG0cmZ0M7Bz4Lm-NkGUMmip5pCNw2-VF-nmGw3P6FP4LOIogNCKbdSvZmAk9dP6DBQ_VNz1zTNl9JAbAt86m2CAo5Sa-sNwbt6fB_kcjn4xxzs7WBYDOrhwPuUxig2myOquNZwXIKVQ4MrLcPbOh7Ngb-_n9rviYzy4g4bZDDWv-Ao2HZHAmxzFSAX_zR19LLv9hfQMHf3eZgF-VE8bdFpwv6iKulXTAkHwVa3DbE_kkedNfsN0f9HB0epbCLz6zURfFBttovqB4Vmm-meobMemHHYSscGSFLLJOlmYDNOgWlU00CfIfO_FdXrySuOY4YjF2e-rAIXu7qu-NUrLrY50dBOhotOuggVhwFf7cs85kVLpyUjnjzot6EFzUUKE1wqnmRLHT04hycMTvPLbw
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
      {logo && <img src={logo} height="60px" style={{ marginTop: 48 }} />}
      <div style={{ fontSize: '42px', fontWeight: 'bold', marginTop: 48, marginBottom: -12 }}>
        {title}
      </div>
      {description && (
        <div style={{ opacity: 0.8, fontSize: '32px', marginTop: 24 }}>{description}</div>
      )}
    </div>,
    {
      width: 1200,
      height: 630,
    },
  )
}
