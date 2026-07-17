import { PromptFrame } from './internal/Prompt.client.js'
import * as PromptTokens from './internal/prompt.js'

export function Prompt(props: Prompt.Props) {
  const { className, value } = props
  const tokens = PromptTokens.tokenize(value)

  return (
    <PromptFrame className={className} value={value}>
      {tokens.map((token, index) => {
        const key = `${token.type}-${index.toString()}`
        if (token.type === 'url')
          return (
            <a
              data-v-prompt-token={token.type}
              href={token.value}
              key={key}
              rel="noopener noreferrer"
              target="_blank"
            >
              {token.value}
            </a>
          )
        if (token.type === 'code')
          return (
            <span data-v-prompt-token={token.type} key={key}>
              <span data-v-prompt-delimiter>`</span>
              {token.value.slice(1, -1)}
              <span data-v-prompt-delimiter>`</span>
            </span>
          )
        return (
          <span data-v-prompt-token={token.type} key={key}>
            {token.value}
          </span>
        )
      })}
    </PromptFrame>
  )
}

export declare namespace Prompt {
  type Props = {
    className?: string | undefined
    value: string
  }
}
