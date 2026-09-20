'use client'

import { cx } from 'cva'
import * as React from 'react'
import { useRouter } from 'waku'
import { style, theme } from 'zyzz/default'
import LucideThumbsDown from '~icons/lucide/thumbs-down'
import LucideThumbsUp from '~icons/lucide/thumbs-up'
import { useConfig } from '../useConfig.js'

namespace styles {
  export const feedback = style({
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: '13px',
    color: theme.vars.color.gray['900'],
  })
  export const feedback2 = style({ fontWeight: 'medium', color: theme.vars.color.foreground })
  export const feedback3 = style({
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    fontSize: '13px',
  })
  export const feedback4 = style({ fontWeight: 'medium', color: theme.vars.color.foreground })
  export const feedback5 = style({
    display: 'flex',
    flexDirection: 'column',
    gap: 'calc(0.25rem * 1.5)',
  })
  export const feedback6 = style({
    display: 'flex',
    cursor: 'pointer',
    alignItems: 'center',
    gap: 2,
    color: theme.vars.color.gray['900'],
    selectors: { '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } } },
  })
  export const feedback7 = style({
    width: 4,
    height: 4,
    accentColor: theme.vars.color.blue['700'],
  })
  export const feedback8 = style({
    ':focus': { outlineStyle: 'none', borderColor: 'blue.700' },
    minHeight: 16,
    width: '100%',
    resize: 'none',
    borderRadius: 'lg',
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: theme.vars.color.gray['400'],
    backgroundColor: theme.vars.color.background['200'],
    padding: 2,
    fontSize: '13px',
    color: theme.vars.color.foreground,
    selectors: {
      '&::placeholder': {
        color: `color-mix(in oklab, ${theme.vars.color.gray['900']} 60%, transparent)`,
      },
    },
  })
  export const feedback9 = style({
    cursor: 'pointer',
    alignSelf: 'flex-start',
    borderRadius: 'lg',
    backgroundColor: theme.vars.color.gray['100'],
    paddingInline: 4,
    paddingBlock: 2,
    fontWeight: 'medium',
    color: theme.vars.color.foreground,
    selectors: {
      '&:hover': { '@media (hover: hover)': { opacity: '80%' } },
      '&:disabled': { cursor: 'not-allowed', opacity: '50%' },
    },
  })
  export const feedback10 = style({
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    fontSize: '13px',
  })
  export const feedback11 = style({ fontWeight: 'medium', color: theme.vars.color.foreground })
  export const feedback12 = style({ display: 'flex', gap: 'calc(0.25rem * 0.5)' })
  export const feedback13 = style({
    display: 'flex',
    width: 8,
    height: 8,
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.vars.color.gray['900'],
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: { '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } } },
  })
  export const feedback14 = style({ width: 5, height: 5 })
  export const feedback15 = style({
    display: 'flex',
    width: 8,
    height: 8,
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.vars.color.gray['900'],
    transitionProperty:
      'color, background-color, border-color, outline-color, text-decoration-color, fill, stroke',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    transitionDuration: '150ms',
    selectors: { '&:hover': { '@media (hover: hover)': { color: theme.vars.color.foreground } } },
  })
  export const feedback16 = style({ width: 5, height: 5 })
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
      <div className={cx(styles.feedback().className, className)} data-v-feedback>
        <p {...styles.feedback2()}>Thank you for your feedback!</p>
      </div>
    )
  }

  if (state === 'positive' || state === 'negative') {
    return (
      <form
        className={cx(styles.feedback3().className, className)}
        data-v-feedback
        onSubmit={handleSubmit}
      >
        <p {...styles.feedback4()}>
          {state === 'positive' ? 'What did you like?' : 'What went wrong?'}
        </p>

        <div {...styles.feedback5()}>
          {categories.map((cat) => (
            <label key={cat} {...styles.feedback6()}>
              <input
                checked={category === cat}
                {...styles.feedback7()}
                name="category"
                onChange={() => setCategory(cat)}
                type="radio"
              />
              {cat}
            </label>
          ))}
        </div>

        <textarea
          className={styles.feedback8().className}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us more about your experience."
          value={message}
        />

        <button {...styles.feedback9()} disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    )
  }

  return (
    <div className={cx(styles.feedback10().className, className)} data-v-feedback>
      <p {...styles.feedback11()}>Was this helpful?</p>
      <div {...styles.feedback12()}>
        <button
          aria-label="Yes, this was helpful"
          {...styles.feedback13()}
          onClick={() => setState('positive')}
          type="button"
        >
          <LucideThumbsUp className={styles.feedback14().className} />
        </button>
        <button
          aria-label="No, this was not helpful"
          {...styles.feedback15()}
          onClick={() => setState('negative')}
          type="button"
        >
          <LucideThumbsDown className={styles.feedback16().className} />
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
