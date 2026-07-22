'use client'

import { useEffect, useMemo, useState } from 'react'
import LucideCheck from '~icons/lucide/check'
import LucideChevronDown from '~icons/lucide/chevron-down'
import LucideChevronUp from '~icons/lucide/chevron-up'
import LucideClipboard from '~icons/lucide/clipboard'
import { schemaPropertyId } from '../../../internal/openapi/anchors.js'
import type * as OpenApi from '../../../internal/openapi/index.js'
import { CodeToHtml } from '../CodeToHtml.client.js'
import { registerSampleAnchors, revealAnchor } from './anchor-navigation.client.js'

/**
 * The sticky right-hand panel for an operation: a request code sample with a
 * language selector, an action slot (the `Test Request` button), and the
 * response examples grouped by status code.
 *
 * Snippets are generated server-side with `@scalar/snippetz`; this component
 * only handles tab selection and defers highlighting to Vocs's own Shiki
 * highlighter via `CodeToHtml`. All styling lives in `openapi.css` keyed on the
 * `data-v-openapi-sample*` attributes below.
 */
export function CodeSample(props: CodeSample.Props) {
  const { samples, responses, action, anchors = true } = props
  const [sampleId, setSampleId] = useState(samples[0]?.id)
  const [status, setStatus] = useState(responses[0]?.status)
  // Long requests and requests with many query params collapse by default.
  const [expanded, setExpanded] = useState(false)

  const sample = samples.find((entry) => entry.id === sampleId) ?? samples[0]
  const response = responses.find((entry) => entry.status === status) ?? responses[0]

  // Map each response to the set of schema anchor ids its example lines target,
  // so a left-hand "Example" click can switch to the owning response tab before
  // the matching line is revealed (see `revealResponseLine`).
  const responseAnchors = useMemo(
    () =>
      responses.map((entry) => ({
        status: entry.status,
        ids: new Set(
          entry.linePaths
            .map((path) => (path ? schemaPropertyId(entry.idBase, path) : undefined))
            .filter((value): value is string => Boolean(value)),
        ),
      })),
    [responses],
  )

  // Request sample anchor ids (path + query parameters). Path params are inline
  // spans; query params are whole lines. Both share the operation-scoped id used
  // by the left-hand parameter rows, so a left "Example" can reveal them too.
  // Query params beyond the collapse threshold only render once expanded, so we
  // track which ids are hidden to expand the snippet before revealing them.
  const requestAnchors = useMemo(() => {
    const ids = new Set<string>()
    const collapsedIds = new Set<string>()
    let hasCollapsed = false
    for (const entry of samples) {
      for (const anchor of entry.anchors) ids.add(anchor.id)
      for (const id of entry.lineAnchors) if (id) ids.add(id)
      if (entry.collapsed) {
        hasCollapsed = true
        for (const anchor of entry.collapsed.anchors) collapsedIds.add(anchor.id)
        for (const id of entry.collapsed.lineAnchors) if (id) collapsedIds.add(id)
      }
    }
    const hiddenIds = hasCollapsed
      ? new Set([...ids].filter((id) => !collapsedIds.has(id)))
      : new Set<string>()
    return { ids, hiddenIds }
  }, [samples])

  useEffect(() => {
    if (!anchors) return
    return registerSampleAnchors({
      has: (id) => requestAnchors.ids.has(id) || responseAnchors.some((entry) => entry.ids.has(id)),
      select: (id) => {
        const match = responseAnchors.find((entry) => entry.ids.has(id))
        if (match) {
          setStatus(match.status)
          return
        }
        if (requestAnchors.hiddenIds.has(id)) setExpanded(true)
      },
    })
  }, [anchors, responseAnchors, requestAnchors])

  const view = sample?.collapsed && !expanded ? sample.collapsed : sample

  return (
    <div data-v-openapi-sample>
      {sample && view && (
        <div data-v-openapi-sample-request>
          <div data-v-openapi-sample-header>
            <LanguageDropdown
              samples={samples}
              selected={sample}
              onSelect={(id) => setSampleId(id)}
            />
            <div data-v-openapi-sample-actions>
              <CopyButton code={sample.code} />
              {action}
            </div>
          </div>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: param spans are also reachable via copyable property anchors */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: progressive enhancement over already-linkable property anchors */}
          <div data-v-openapi-sample-request-body onClick={anchors ? onAnchorClick : undefined}>
            <CodeToHtml
              code={view.display}
              lang={sample.lang}
              shrinkIndent={false}
              anchorRanges={anchors ? view.anchors : undefined}
              colorRanges={view.colorRanges}
              lineAnchors={anchors ? view.lineAnchors : undefined}
            />
          </div>
          {sample.collapsed && (
            <button
              type="button"
              data-v-openapi-sample-more
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? (
                <>
                  <LucideChevronUp data-v-openapi-sample-more-icon />
                  {sample.truncatedBody ? 'Collapse' : 'Show less'}
                </>
              ) : (
                <>
                  <LucideChevronDown data-v-openapi-sample-more-icon />
                  {sample.truncatedBody ? 'Expand' : `Show ${sample.hiddenQueryCount} more`}
                </>
              )}
            </button>
          )}
        </div>
      )}

      {response && (
        <div data-v-openapi-sample-response>
          <div data-v-openapi-sample-tabs>
            {responses.map((entry) => (
              <Tab
                key={entry.status}
                active={entry.status === response.status}
                onClick={() => setStatus(entry.status)}
              >
                {entry.status}
              </Tab>
            ))}
          </div>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: rows are also reachable via copyable property anchors */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: progressive enhancement over already-linkable property anchors */}
          <div data-v-openapi-sample-response-body onClick={anchors ? onAnchorClick : undefined}>
            <CodeToHtml
              code={response.code}
              lang={response.lang}
              shrinkIndent={false}
              dimRanges={response.placeholders}
              lineAnchors={
                anchors
                  ? response.linePaths.map((path) =>
                      path ? schemaPropertyId(response.idBase, path) : undefined,
                    )
                  : undefined
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Navigates to the schema row matching a clicked element carrying a
 * `data-anchor` id. Used for both response example lines (per-line anchors) and
 * request sample path/query parameter spans (per-range anchors).
 */
function onAnchorClick(event: React.MouseEvent<HTMLDivElement>) {
  // Don't hijack text selection.
  if (window.getSelection()?.toString()) return
  if (!(event.target instanceof Element)) return
  const line = event.target.closest<HTMLElement>('[data-anchor]')
  if (!line || !event.currentTarget.contains(line)) return
  const anchor = line.dataset['anchor']
  if (!anchor) return
  event.preventDefault()
  void revealAnchor(anchor)
}

/** Copies the current request sample's source to the clipboard. */
function CopyButton(props: { code: string }) {
  const { code } = props
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 1000)
    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(code).then(
          () => setCopied(true),
          () => {},
        )
      }}
      data-v-openapi-action
    >
      {copied ? (
        <LucideCheck data-v-openapi-action-icon data-copied />
      ) : (
        <LucideClipboard data-v-openapi-action-icon />
      )}
      Copy
    </button>
  )
}

/**
 * Language selector for the request sample, rendered as a dropdown (defaulting
 * to the first sample, i.e. cURL) rather than a row of tabs.
 */
function LanguageDropdown(props: {
  samples: OpenApi.CodeSample[]
  selected: OpenApi.CodeSample
  onSelect: (id: string) => void
}) {
  const { samples, selected, onSelect } = props
  const [open, setOpen] = useState(false)
  if (samples.length <= 1) return <span data-v-openapi-lang-label>{selected.label}</span>
  return (
    <div data-v-openapi-lang>
      <button type="button" onClick={() => setOpen((value) => !value)} data-v-openapi-lang-trigger>
        {selected.label}
        <LucideChevronDown data-v-openapi-lang-chevron />
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            data-v-openapi-dropdown-backdrop
            onClick={() => setOpen(false)}
          />
          <ul data-v-openapi-lang-menu>
            {samples.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(entry.id)
                    setOpen(false)
                  }}
                  data-v-openapi-lang-option
                  data-selected={entry.id === selected.id || undefined}
                >
                  <LucideCheck data-v-openapi-lang-option-check />
                  <span data-v-openapi-lang-option-label>{entry.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function Tab(props: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      data-v-openapi-tab
      data-active={props.active || undefined}
    >
      {props.children}
    </button>
  )
}

export declare namespace CodeSample {
  type Props = {
    samples: OpenApi.CodeSample[]
    responses: OpenApi.ResponseSample[]
    /** Action slot rendered between the request and response (the test button). */
    action?: React.ReactNode
    /**
     * Render the clickable schema cross-links in the request/response samples
     * (the hover-highlighted spans/lines that jump to a parameter or property
     * row). Set `false` for a static, non-interactive sample.
     *
     * @default true
     */
    anchors?: boolean | undefined
  }
}
