/**
 * @vitest-environment jsdom
 */
import { describe, expect, test } from 'vitest'
import { getHeadingText } from './getHeadingText.js'

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
