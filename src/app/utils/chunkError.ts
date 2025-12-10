export function isChunkError(error: Error) {
  if (!error) return false
  if (!error.message) return false
  const message = error.message.toLowerCase()
  return (
    message.includes('failed to fetch dynamically imported module') || // Chrome
    message.includes('error loading dynamically imported module') || // Firefox/Safari
    message.includes('dynamically imported module') // fallback
  )
}

export function maybeHandleChunkError(error: Error) {
  if (!isChunkError(error)) return
  if (sessionStorage.getItem(reloadKey)) {
    sessionStorage.removeItem(reloadKey)
    return
  }
  sessionStorage.setItem(reloadKey, 'true')
  window.location.reload()
}

export function clearChunkReloadFlag() {
  sessionStorage.removeItem(reloadKey)
}

const reloadKey = 'vocs.reload'
