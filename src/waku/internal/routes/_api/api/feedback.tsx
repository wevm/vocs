import * as Config from '../../../../../internal/config.js'
import type * as Feedback from '../../../../../internal/feedback.js'

/**
 * POST /api/feedback - Submit user feedback
 *
 * Receives feedback data from the client and forwards it to the configured
 * feedback adapter (e.g., Slack webhook). The adapter configuration (including
 * secrets like webhook URLs) is kept server-side only.
 */
export async function POST(request: Request) {
  const config = await Config.resolve({ server: true })

  if (!config._feedback) {
    return Response.json({ error: 'Feedback not enabled' }, { status: 404 })
  }

  let body: Feedback.FeedbackData
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (typeof body.helpful !== 'boolean' || typeof body.pageUrl !== 'string') {
    return Response.json({ error: 'Invalid feedback data' }, { status: 400 })
  }

  try {
    await config._feedback.submit({
      helpful: body.helpful,
      category: body.category,
      message: body.message,
      pageUrl: body.pageUrl,
      timestamp: body.timestamp || new Date().toISOString(),
    })
    return Response.json({ success: true })
  } catch (error) {
    console.error('Feedback submission failed:', error)
    return Response.json({ error: 'Submission failed' }, { status: 500 })
  }
}
