export function removeTempStyles() {
  const tempStyles = document.querySelectorAll('style[data-vocs-temp-style="true"]')
  for (const style of tempStyles) style.remove()
}
