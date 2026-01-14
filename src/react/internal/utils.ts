import { getIconData, iconToHTML, iconToSVG } from '@iconify/utils'
import { icons as lucide } from '@iconify-json/lucide'

export function getIconHtml(name: string, className: string = '') {
  const data = getIconData(lucide, name)
  if (!data) return ''
  const { attributes, body } = iconToSVG(data)
  return iconToHTML(body, { ...attributes, class: className })
}
