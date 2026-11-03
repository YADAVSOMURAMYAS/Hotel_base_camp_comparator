import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// jsdom has no matchMedia. Tests run as a user who prefers reduced motion, so map animations
// jump instead of running frame by frame (which would slow every DOM query); the light theme
// stays the default. Individual tests override this where they test motion.
beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as never
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})
