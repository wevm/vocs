import { useConfig } from '../hooks/useConfig.js'
import { Link } from './Link.js'

export function LlmLink() {
  const { baseUrl, llmLink } = useConfig()

  if (!llmLink) return null

  const url = typeof llmLink === 'object' ? (llmLink.url ?? '/llms.txt') : '/llms.txt'
  const text = typeof llmLink === 'object' ? (llmLink.text ?? 'llms.txt') : 'llms.txt'

  const finalUrl = baseUrl ? `${baseUrl}${url}` : url

  return (
    <div>
      <Link href={finalUrl} variant="styleless">
        {text}
      </Link>
    </div>
  )
}
