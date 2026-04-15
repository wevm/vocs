import type { ShikiTransformer } from '@shikijs/types'
import type { Element as HastElement } from 'hast'
import { addClassToHast } from 'shiki'

const colorProperties = new Set([
  '--shiki-dark',
  '--shiki-dark-bg',
  '--shiki-light',
  '--shiki-light-bg',
  'background-color',
  'color',
])

const styleToClassName = new Map<string, string>()
const classNameToStyle = new Map<string, string>()

export const dataAttribute = 'data-v-shiki-css'
export const styleAttribute = 'data-v-shiki-colors'

export function tokenClasses(): tokenClasses.ReturnType {
  return {
    name: 'vocs:token-classes',
    root(root) {
      const pre = root.children.find(
        (child): child is HastElement => child.type === 'element' && child.tagName === 'pre',
      )
      if (!pre) return

      const code = pre.children.find(
        (child): child is HastElement => child.type === 'element' && child.tagName === 'code',
      )
      if (!code) return

      const rules = new Map<string, string>()

      walkStyledSpans(code, (span) => {
        const style =
          typeof span.properties['style'] === 'string' ? span.properties['style'] : undefined
        if (!style) return

        const { color, rest } = splitStyle(style)
        if (!color) return

        const className = classNameForTokenStyle(color)
        addClassToHast(span, className)
        rules.set(className, `.${className}{${color}}`)

        if (rest) span.properties['style'] = rest
        else delete span.properties['style']
      })

      if (rules.size === 0) return

      pre.properties[dataAttribute] = Array.from(rules.values()).join('\n')
    },
  }
}

export declare namespace tokenClasses {
  type ReturnType = ShikiTransformer
}

export function splitStyle(style: string): splitStyle.ReturnType {
  const colorDeclarations: string[] = []
  const restDeclarations: string[] = []

  for (const rawDeclaration of style.split(';')) {
    const declaration = rawDeclaration.trim()
    if (!declaration) continue

    const separatorIndex = declaration.indexOf(':')
    if (separatorIndex < 0) continue

    const property = declaration.slice(0, separatorIndex).trim()
    if (colorProperties.has(property)) colorDeclarations.push(declaration)
    else restDeclarations.push(declaration)
  }

  return {
    color: colorDeclarations.join(';'),
    rest: restDeclarations.join(';'),
  }
}

export declare namespace splitStyle {
  type ReturnType = {
    color: string
    rest: string
  }
}

export function classNameForTokenStyle(style: string) {
  const existing = styleToClassName.get(style)
  if (existing) return existing

  const baseClassName = `vocs-shiki-${hashStyle(style)}`
  let className = baseClassName
  let suffix = 1

  while (classNameToStyle.has(className) && classNameToStyle.get(className) !== style) {
    className = `${baseClassName}-${suffix++}`
  }

  styleToClassName.set(style, className)
  classNameToStyle.set(className, style)
  return className
}

export function installTokenClassesRuntime(
  document_: installTokenClassesRuntime.DocumentLike,
  window_: installTokenClassesRuntime.WindowLike,
  dataAttribute_: string,
  styleAttribute_: string,
) {
  const isElementLike = (value: unknown): value is installTokenClassesRuntime.ElementLike => {
    return (
      typeof value === 'object' &&
      value !== null &&
      'getAttribute' in value &&
      typeof value.getAttribute === 'function' &&
      'matches' in value &&
      typeof value.matches === 'function' &&
      'removeAttribute' in value &&
      typeof value.removeAttribute === 'function'
    )
  }

  const querySelectorAll = (root: installTokenClassesRuntime.ParentNodeLike, selector: string) => {
    if (typeof root.querySelectorAll !== 'function') return []
    return Array.from(root.querySelectorAll(selector))
  }

  const existingRuntime = window_.__vocsShikiTokenClasses
  if (existingRuntime) {
    existingRuntime.flush(document_)
    return
  }

  let style = document_.querySelector(`style[${styleAttribute_}]`)
  if (!style) {
    style = document_.createElement('style')
    style.setAttribute(styleAttribute_, '')
    document_.head.appendChild(style)
  }

  const seen = new Set<string>()

  const append = (css: string) => {
    if (!css || seen.has(css)) return
    seen.add(css)
    style.textContent = `${style.textContent ?? ''}${css}`
  }

  const flush = (root: installTokenClassesRuntime.ParentNodeLike) => {
    const nodes = [
      ...(isElementLike(root) && root.matches(`pre[${dataAttribute_}]`) ? [root] : []),
      ...querySelectorAll(root, `pre[${dataAttribute_}]`),
    ]

    for (const pre of nodes) {
      const css = pre.getAttribute(dataAttribute_)
      if (css) css.split('\n').forEach(append)
      pre.removeAttribute(dataAttribute_)
    }
  }

  const MutationObserver_ = window_.MutationObserver
  if (document_.body && MutationObserver_) {
    new MutationObserver_((records) => {
      for (const record of records) {
        for (const node of Array.from(record.addedNodes)) {
          if (isElementLike(node)) flush(node)
        }
      }
    }).observe(document_.body, { childList: true, subtree: true })
  }

  window_.__vocsShikiTokenClasses = { flush }
  flush(document_)
}

export declare namespace installTokenClassesRuntime {
  type ParentNodeLike = {
    querySelectorAll?: (selector: string) => Iterable<ElementLike> | ArrayLike<ElementLike>
  }

  type ElementLike = ParentNodeLike & {
    getAttribute(name: string): string | null
    matches(selector: string): boolean
    removeAttribute(name: string): void
    setAttribute(name: string, value: string): void
    textContent: string | null
  }

  type DocumentLike = ParentNodeLike & {
    body: ParentNodeLike | null
    createElement(tagName: string): ElementLike
    head: {
      appendChild(node: unknown): unknown
    }
    querySelector(selector: string): ElementLike | null
  }

  type MutationRecordLike = {
    addedNodes: Iterable<unknown> | ArrayLike<unknown>
  }

  type MutationObserverLike = {
    observe(target: unknown, options?: unknown): unknown
  }

  type MutationObserverConstructor = new (
    callback: (records: MutationRecordLike[]) => void,
  ) => MutationObserverLike

  type WindowLike = {
    MutationObserver?: MutationObserverConstructor
    __vocsShikiTokenClasses?: {
      flush(root: ParentNodeLike): void
    }
  }
}

export const tokenClassesScript = `;(${installTokenClassesRuntime.toString()})(document, window, ${JSON.stringify(dataAttribute)}, ${JSON.stringify(styleAttribute)});`

declare global {
  interface Window {
    __vocsShikiTokenClasses?: {
      flush(root: installTokenClassesRuntime.ParentNodeLike): void
    }
  }
}

function hashStyle(style: string) {
  let hash = 2166136261

  for (let index = 0; index < style.length; index++) {
    hash ^= style.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36)
}

function walkStyledSpans(node: HastElement, callback: (span: HastElement) => void) {
  for (const child of node.children) {
    if (child.type !== 'element') continue
    if (child.tagName === 'span' && typeof child.properties['style'] === 'string') callback(child)
    walkStyledSpans(child, callback)
  }
}
