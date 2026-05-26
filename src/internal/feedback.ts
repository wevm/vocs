/**
 * Feedback adapters for collecting user feedback.
 */

export type Adapter = {
  /** Adapter type identifier */
  type: string
  /** Submit feedback to the configured destination */
  submit: (data: FeedbackData) => Promise<void>
}

export type FeedbackData = {
  /** Whether the user found the page helpful */
  helpful: boolean
  /** What aspect they liked (for positive feedback) */
  category?: string | undefined
  /** Free-form message from the user */
  message?: string | undefined
  /** URL of the page where feedback was submitted */
  pageUrl: string
  /** ISO timestamp of when feedback was submitted */
  timestamp: string
}

/**
 * Creates a feedback adapter from a custom adapter definition.
 *
 * Defaults to `process.env.SLACK_FEEDBACK_WEBHOOK` if not provided.
 * ```ts
 * import { Feedback } from 'vocs'
 *
 * export default defineConfig({
 *   feedback: Feedback.from({
 *     type: 'custom',
 *     async submit(data) { ... },
 *   }),
 * })
 * ```
 */
export function from(adapter: Adapter): Adapter {
  return adapter
}

/**
 * Creates a Slack feedback adapter.
 * Sends feedback to a Slack channel via incoming webhook.
 *
 * Defaults to `process.env.SLACK_FEEDBACK_WEBHOOK` if not provided.
 * ```ts
 * import { Feedback } from 'vocs'
 *
 * export default defineConfig({
 *   feedback: Feedback.slack({
 *     webhookUrl: process.env.SLACK_WEBHOOK_URL,
 *   }),
 * })
 * ```
 */
export function slack(options: slack.Options = {}): Adapter {
  const webhookUrl = options.webhookUrl ?? process.env['SLACK_FEEDBACK_WEBHOOK']
  return {
    type: 'slack',
    async submit(data) {
      if (!webhookUrl) {
        console.warn('[vocs] Slack webhook URL not configured. Feedback received:', data)
        return
      }

      // Sanitize user input to prevent @mentions, #channels, and <!commands>
      const sanitize = (text: string) =>
        text
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/@/g, '@\u200B')
          .replace(/#/g, '#\u200B')

      const emoji = data.helpful ? ':thumbsup:' : ':thumbsdown:'
      const sentiment = data.helpful ? 'Positive' : 'Negative'

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${sentiment} Feedback`,
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Page:*\n<${data.pageUrl}|${data.pageUrl}>`,
            },
            {
              type: 'mrkdwn',
              text: `*Time:*\n${new Date(data.timestamp).toLocaleString()}`,
            },
          ],
        },
      ]

      if (data.category)
        blocks.push({
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Category:*\n${sanitize(data.category)}`,
            },
          ],
        })

      if (data.message)
        blocks.push({
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Message:*\n${sanitize(data.message)}`,
            },
          ],
        })

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      })
      if (!response.ok) throw new Error(`Slack webhook error: ${response.status}`)
    },
  }
}

export declare namespace slack {
  type Options = {
    /**
     * Slack incoming webhook URL.
     * Create one at: https://api.slack.com/messaging/webhooks
     * Defaults to `process.env.SLACK_FEEDBACK_WEBHOOK` if not provided.
     */
    webhookUrl?: string | undefined
  }
}
