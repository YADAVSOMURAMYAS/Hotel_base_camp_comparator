// Colour contrast (WCAG AA) for every text/background pair the design uses, in both themes.
// The tokens are read from tokens.css itself, so changing a colour there is checked here.
/// <reference types="node" />
import { readFileSync } from 'node:fs'

// Read as a file (tests run from the Frontend folder): the Vitest config turns CSS imports off.
const css = readFileSync('src/styles/tokens.css', 'utf-8')

/** Custom properties declared in the block that starts with `selector`. */
function tokens(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`)
  const body = css.slice(start, css.indexOf('}', start))
  return Object.fromEntries(
    [...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((m) => [m[1], m[2]]),
  )
}

const light = tokens(':root')
const dark = { ...light, ...tokens(":root[data-theme='dark']") }

function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2)
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// [foreground token, background token, minimum ratio]
const TEXT_PAIRS: [string, string, number][] = [
  ['color-text', 'color-bg', 4.5],
  ['color-text', 'color-surface', 4.5],
  ['color-muted', 'color-bg', 4.5],
  ['color-muted', 'color-surface', 4.5],
  ['color-muted', 'color-bg-2', 4.5],
  ['color-accent', 'color-surface', 4.5],
  ['color-accent', 'color-bg', 4.5],
  ['color-success', 'color-surface', 4.5],
  ['color-warning', 'color-surface', 4.5],
  ['color-error', 'color-surface', 4.5],
  ['color-on-ink', 'color-ink', 4.5],
  // Focus rings and the large score numbers need 3:1.
  ['color-ink', 'color-bg', 3],
  ['color-ink', 'color-surface', 3],
]

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme contrast', (_name, theme) => {
  it.each(TEXT_PAIRS)('%s on %s is at least %s:1', (fg, bg, min) => {
    expect(contrast(theme[fg], theme[bg])).toBeGreaterThanOrEqual(min)
  })
})

it('black text sits on the orange accent at AA', () => {
  expect(contrast('#111111', light.orange)).toBeGreaterThanOrEqual(4.5)
})
