'use client'

import { cx } from 'cva'
import * as React from 'react'
import { useRouter } from 'waku'
import LucideThumbsDown from '~icons/lucide/thumbs-down'
import LucideThumbsUp from '~icons/lucide/thumbs-up'
import { useConfig } from '../useConfig.js'

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
      <div
        className={cx(
          'vocs:flex vocs:flex-col vocs:gap-2 vocs:text-[13px] vocs:text-secondary',
          className,
        )}
        data-v-feedback
      >
        <p className="vocs:text-heading vocs:font-medium">Thank you for your feedback!</p>
      </div>
    )
  }

  if (state === 'positive' || state === 'negative') {
    return (
      <form
        className={cx('vocs:flex vocs:flex-col vocs:gap-3 vocs:text-[13px]', className)}
        data-v-feedback
        onSubmit={handleSubmit}
      >
        <p className="vocs:text-heading vocs:font-medium">
          {state === 'positive' ? 'What did you like?' : 'What went wrong?'}
        </p>

        <div className="vocs:flex vocs:flex-col vocs:gap-1.5">
          {categories.map((cat) => (
            <label
              key={cat}
              className="vocs:flex vocs:items-center vocs:gap-2 vocs:cursor-pointer vocs:text-secondary vocs:hover:text-heading"
            >
              <input
                checked={category === cat}
                className="vocs:size-4 vocs:accent-accent"
                name="category"
                onChange={() => setCategory(cat)}
                type="radio"
              />
              {cat}
            </label>
          ))}
        </div>

        <textarea
          className="vocs:w-full vocs:min-h-16 vocs:p-2 vocs:text-[13px] vocs:bg-primary vocs:border vocs:border-primary vocs:rounded-lg vocs:resize-none vocs:text-heading vocs:placeholder:text-secondary/60 focus:vocs:outline-none focus:vocs:border-accent"
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us more about your experience."
          value={message}
        />

        <button
          className="vocs:self-start vocs:px-4 vocs:py-2 vocs:bg-surfaceTint vocs:text-heading vocs:font-medium vocs:rounded-lg vocs:cursor-pointer vocs:hover:opacity-80 vocs:disabled:opacity-50 vocs:disabled:cursor-not-allowed"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    )
  }

  return (
    <div
      className={cx('vocs:flex vocs:flex-col vocs:gap-2 vocs:text-[13px]', className)}
      data-v-feedback
    >
      <p className="vocs:text-heading vocs:font-medium">Was this helpful?</p>
      <div className="vocs:flex vocs:gap-0.5">
        <button
          aria-label="Yes, this was helpful"
          className="vocs:flex vocs:items-center vocs:justify-center vocs:size-8 vocs:text-secondary vocs:hover:text-heading vocs:cursor-pointer vocs:transition-colors"
          onClick={() => setState('positive')}
          type="button"
        >
          <LucideThumbsUp className="vocs:size-5" />
        </button>
        <button
          aria-label="No, this was not helpful"
          className="vocs:flex vocs:items-center vocs:justify-center vocs:size-8 vocs:text-secondary vocs:hover:text-heading vocs:cursor-pointer vocs:transition-colors"
          onClick={() => setState('negative')}
          type="button"
        >
          <LucideThumbsDown className="vocs:size-5" />
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
