'use client'

import * as React from 'react'
import { useRouter } from 'waku'
import LucideThumbsDown from '~icons/lucide/thumbs-down'
import LucideThumbsUp from '~icons/lucide/thumbs-up'
import { style, vars } from '../../styles/zyzz.config.js'
import { useConfig } from '../useConfig.js'

namespace styles {
  export const confirmation = style({
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
    fontSize: '13px !custom',
    color: 'secondary',
  })

  export const prompt = style({
    fontWeight: 'medium',
    color: 'heading',
  })

  export const form = style({
    display: 'flex',
    flexDirection: 'column',
    gap: '3',
    fontSize: '13px !custom',
  })

  export const categories = style({
    display: 'flex',
    flexDirection: 'column',
    gap: 'oneAndHalf',
  })

  export const category = style({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: '2',
    color: 'secondary',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'heading',
        },
      },
    },
  })

  export const categoryInput = style({
    width: '4',
    height: '4',
    accentColor: 'accent',
  })

  export const submit = style({
    cursor: 'pointer',
    alignSelf: 'flex-start',
    borderRadius: 'lg',
    backgroundColor: 'surfaceTint',
    paddingInline: '4',
    paddingBlock: '2',
    fontWeight: 'medium',
    color: 'heading',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          opacity: '80%',
        },
      },
      '&:disabled': {
        cursor: 'not-allowed',
        opacity: '50%',
      },
    },
  })

  export const root = style({
    display: 'flex',
    flexDirection: 'column',
    gap: '2',
    fontSize: '13px !custom',
  })

  export const actions = style({
    display: 'flex',
    gap: 'half',
  })

  export const vote = style({
    display: 'flex',
    width: '8',
    height: '8',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'secondary',
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'standard',
    transitionDuration: 'standard',
    selectors: {
      '&:hover': {
        '@media (hover: hover)': {
          color: 'heading',
        },
      },
    },
  })

  export const icon = style({
    width: '5',
    height: '5',
  })

  export const message = style({
    minHeight: '16',
    width: '100% !custom',
    resize: 'none',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'primary',
    backgroundColor: 'primary',
    padding: '2',
    fontSize: '13px !custom',
    color: 'heading',
    selectors: {
      '&::placeholder': {
        color: 'secondary',
        '@supports (color: color-mix(in lab, red, red))': {
          color: `color-mix(in oklab, ${vars.textColor.secondary} 60%, transparent) !custom`,
        },
      },
    },
  })
}

type FeedbackState = 'initial' | 'positive' | 'negative' | 'submitted'

const positiveCategories = [
  'Accurate',
  'Easy to understand',
  'Solved my problem',
  'Helped me decide to use the product',
  'Other',
]

const negativeCategories = [
  'Inaccurate',
  'Hard to understand',
  'Missing information',
  'Outdated',
  'Other',
]

export function Feedback(props: Feedback.Props) {
  const { className, frontmatter } = props

  const config = useConfig()
  const router = useRouter()
  const { feedback } = config

  const [state, setState] = React.useState<FeedbackState>('initial')
  const [category, setCategory] = React.useState<string>('')
  const [message, setMessage] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on route change
  React.useEffect(() => {
    setState('initial')
    setCategory('')
    setMessage('')
  }, [router.path])

  if (!feedback || frontmatter?.showFeedback === false) return null

  const categories = state === 'positive' ? positiveCategories : negativeCategories

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (isSubmitting || !feedback) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          helpful: state === 'positive',
          category: category || undefined,
          message: message || undefined,
          pageUrl: typeof window !== 'undefined' ? window.location.href : '',
          timestamp: new Date().toISOString(),
        }),
      })
      if (!response.ok) throw new Error('Submission failed')
      setState('submitted')
    } catch (error) {
      console.error('Feedback submission failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (state === 'submitted') {
    return (
      <div {...styles.confirmation({ className })} data-v-feedback>
        <p {...styles.prompt()}>Thank you for your feedback!</p>
      </div>
    )
  }

  if (state === 'positive' || state === 'negative') {
    return (
      <form {...styles.form({ className })} data-v-feedback onSubmit={handleSubmit}>
        <p {...styles.prompt()}>
          {state === 'positive' ? 'What did you like?' : 'What went wrong?'}
        </p>

        <div {...styles.categories()}>
          {categories.map((cat) => (
            <label key={cat} {...styles.category()}>
              <input
                checked={category === cat}
                {...styles.categoryInput()}
                name="category"
                onChange={() => setCategory(cat)}
                type="radio"
              />
              {cat}
            </label>
          ))}
        </div>

        <textarea
          {...styles.message()}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us more about your experience."
          value={message}
        />

        <button {...styles.submit()} disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    )
  }

  return (
    <div {...styles.root({ className })} data-v-feedback>
      <p {...styles.prompt()}>Was this helpful?</p>
      <div {...styles.actions()}>
        <button
          aria-label="Yes, this was helpful"
          {...styles.vote()}
          onClick={() => setState('positive')}
          type="button"
        >
          <LucideThumbsUp {...styles.icon()} />
        </button>
        <button
          aria-label="No, this was not helpful"
          {...styles.vote()}
          onClick={() => setState('negative')}
          type="button"
        >
          <LucideThumbsDown {...styles.icon()} />
        </button>
      </div>
    </div>
  )
}

export declare namespace Feedback {
  export type Props = {
    className?: string | undefined
    frontmatter?: { showFeedback?: boolean | undefined } | undefined
  }
}
