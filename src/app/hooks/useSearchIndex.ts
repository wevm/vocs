import MiniSearch from 'minisearch'
import { useEffect, useState } from 'react'
import { searchIndex as virtualSearchIndex } from 'virtual:searchIndex'

export type Result = {
  href: string
  html: string
  text?: string
  title: string
  titles: string[]
}

export function useSearchIndex(): MiniSearch<Result> {
  const [searchIndex, _setSearchIndex] = useState(() =>
    MiniSearch.loadJSON<Result>(virtualSearchIndex, {
      fields: ['title', 'titles', 'text'],
      searchOptions: {
        boost: { title: 4, text: 2, titles: 1 },
        fuzzy: 0.2,
        prefix: true,
        // ...(theme.value.search?.provider === 'local' &&
        //   theme.value.search.options?.miniSearch?.searchOptions),
      },
      storeFields: ['href', 'html', 'text', 'title', 'titles'],
      // ...(theme.value.search?.provider === 'local' &&
      //   theme.value.search.options?.miniSearch?.options),
    }),
  )

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
