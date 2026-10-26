/**
 * @vitest-environment jsdom
 */
import { describe, expect, test } from 'vitest'
import { getHeadingText } from './getHeadingText.js'
import { getOutlineHeadings } from './getOutlineHeadings.js'

describe('getHeadingText', () => {
  test('returns plain text content', () => {
    const h2 = document.createElement('h2')
    h2.textContent = 'Tempo Wallet'
    expect(getHeadingText(h2)).toBe('Tempo Wallet')
  })

  test('strips children with data-toc-exclude', () => {
    const h2 = document.createElement('h2')
    h2.innerHTML = 'Tempo Wallet <span data-toc-exclude>Recommended</span>'
    expect(getHeadingText(h2)).toBe('Tempo Wallet')
  })

  test('strips nested data-toc-exclude elements', () => {
    const h2 = document.createElement('h2')
    h2.innerHTML = 'Getting Started <span data-toc-exclude><span>Beta</span></span> Guide'
    expect(getHeadingText(h2)).toBe('Getting Started  Guide')
  })

  test('strips multiple data-toc-exclude elements', () => {
    const h2 = document.createElement('h2')
    h2.innerHTML =
      '<span data-toc-exclude>New</span> Tempo Wallet <span data-toc-exclude>Recommended</span>'
    expect(getHeadingText(h2)).toBe('Tempo Wallet')
  })

  test('does not mutate the original element', () => {
    const h2 = document.createElement('h2')
    h2.innerHTML = 'Tempo Wallet <span data-toc-exclude>Recommended</span>'
    getHeadingText(h2)
    expect(h2.querySelectorAll('[data-toc-exclude]').length).toBe(1)
    expect(h2.textContent).toBe('Tempo Wallet Recommended')
  })

  test('returns empty string for empty heading', () => {
    const h2 = document.createElement('h2')
    expect(getHeadingText(h2)).toBe('')
  })
})

describe('getOutlineHeadings', () => {
  function ids(root: ParentNode) {
    return getOutlineHeadings(root).map((element) => element.id)
  }

  test('returns headings with ids inside page content', () => {
    const root = document.createElement('div')
    root.innerHTML = [
      '<h2 id="outside">Outside</h2>',
      '<article data-v-content>',
      '<h1 id="title">Title</h1>',
      '<h2 id="a">A</h2>',
      '<h3 id="b">B</h3>',
      '<h2>No id</h2>',
      '</article>',
    ].join('')
    expect(ids(root)).toMatchInlineSnapshot(`
      [
        "a",
        "b",
      ]
    `)
  })

  test('skips changelog release headings', () => {
    const root = document.createElement('div')
    root.innerHTML = [
      '<article data-v-content>',
      '<h2 id="intro">Intro</h2>',
      '<div data-v-changelog><div data-v-content><h2 id="v1">v1</h2></div></div>',
      '</article>',
    ].join('')
    expect(ids(root)).toMatchInlineSnapshot(`
      [
        "intro",
      ]
    `)
  })

  test('skips headings inside hidden content (e.g. inactive tab panels)', () => {
    const root = document.createElement('div')
    root.innerHTML = [
      '<article data-v-content>',
      '<h2 id="intro">Intro</h2>',
      '<article data-v-content role="tabpanel"><h2 id="active">Active</h2></article>',
      '<article data-v-content role="tabpanel" hidden><h2 id="inactive">Inactive</h2></article>',
      '</article>',
    ].join('')
    expect(ids(root)).toMatchInlineSnapshot(`
      [
        "intro",
        "active",
      ]
    `)
  })
})
