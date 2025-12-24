'use client'

import { useRouter } from 'waku'
import { Head as BaseHead } from '../../react/Head.js'

export function Head() {
  const { path } = useRouter()
  return <BaseHead pathname={path} />
}
