import { useLoaderData } from 'react-router-dom'

import type { PageData } from '../types.js'

export function usePageData(): PageData {
  return useLoaderData() as PageData
}
