import { useEffect } from 'react'
import { UAParser } from 'ua-parser-js'

const parser = new UAParser()
const engine = parser.getEngine()

// Prevents FOUC on page load – CSS transitions seem to not play nicely.
export function useApplyCssTransition() {
  useEffect(() => {
    function set() {
      const style = document.createElement('style')
      style.textContent = '* { transition: color 0.1s, background-color 0.1s; }'
      document.head.appendChild(style)
    }
    if (engine.name === 'WebKit') setTimeout(set, 500)
    else set()
  }, [])
}
