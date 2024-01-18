import MiniSearch from 'minisearch'
import { useEffect, useState } from 'react'
import { getSearchIndex } from 'virtual:searchIndex'

export type Result = {
  href: string
  html: string
  isPage: boolean
  text?: string
  title: string
  titles: string[]
}

let promise: Promise<string>

export function useSearchIndex(): MiniSearch<Result> | undefined {
  const [searchIndex, setSearchIndex] = useState<MiniSearch<Result>>()

  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    ;(async () => {
      if (!promise) promise = getSearchIndex()
      const json = await promise
      const searchIndex = MiniSearch.loadJSON<Result>(json, {
        fields: ['title', 'titles', 'text'],
        searchOptions: {
          boost: { title: 4, text: 2, titles: 1 },
          fuzzy: 0.2,
          prefix: true,
          // ...(theme.value.search?.provider === 'local' &&
          //   theme.value.search.options?.miniSearch?.searchOptions),
        },
        storeFields: ['href', 'html', 'isPage', 'text', 'title', 'titles'],
        // ...(theme.value.search?.provider === 'local' &&
        //   theme.value.search.options?.miniSearch?.options),
      })
      setSearchIndex(searchIndex)
    })()
  }, [])

  useEffect(() => {
    if (!import.meta.hot) return

    // TODO: Update index
    import.meta.hot.accept('virtual:searchIndex', (m) => {
      if (m) {
        console.log('update', m)
      }
    })
  }, [])

  return searchIndex
}
