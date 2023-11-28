import { useState, useEffect } from 'react'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'

import { PageFind } from './Pagefind.js'
import * as styles from './DesktopSearch.css.js'

export function DesktopSearch() {
  const [isOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    function keyDownHandler(event: KeyboardEvent) {
      const isInput =
        document.activeElement instanceof HTMLElement &&
        (['input', 'select', 'textarea'].includes(document.activeElement.tagName.toLowerCase()) ||
          document.activeElement.isContentEditable)

      if (event.key === '/' && !isOpen && !isInput) {
        console.log('slash')
        setIsSearchOpen(true)
      } else if (event.metaKey === true && event.key === 'k') {
        console.log('meta + k')
        setIsSearchOpen((x) => !x)
      }
    }

    window.addEventListener('keydown', keyDownHandler)
    return () => {
      window.removeEventListener('keydown', keyDownHandler)
    }
  }, [isOpen])

  return (
    <>
      <button className={styles.search} type="button" onClick={() => setIsSearchOpen(true)}>
        <MagnifyingGlassIcon style={{ marginTop: 2 }} />
        Search
        <div className={styles.searchCommand}>
          <div
            style={{
              background: 'currentColor',
              transform: 'rotate(45deg)',
              width: 1.5,
              borderRadius: 2,
              height: '100%',
            }}
          />
        </div>
      </button>
      <PageFind isOpen={isOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  )
}
