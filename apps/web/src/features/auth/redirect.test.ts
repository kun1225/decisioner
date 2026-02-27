import { describe, expect, it } from 'vitest'

import { sanitizeRedirectTarget } from './redirect'

describe('sanitizeRedirectTarget', () => {
  it('allows relative app paths', () => {
    expect(sanitizeRedirectTarget('/')).toBe('/')
    expect(sanitizeRedirectTarget('/train/start')).toBe('/train/start')
    expect(sanitizeRedirectTarget('/workouts/history?tab=all')).toBe(
      '/workouts/history?tab=all',
    )
  })

  it('falls back to / for unsafe values', () => {
    expect(sanitizeRedirectTarget('https://evil.com')).toBe('/')
    expect(sanitizeRedirectTarget('//evil.com')).toBe('/')
    expect(sanitizeRedirectTarget('javascript:alert(1)')).toBe('/')
    expect(sanitizeRedirectTarget('train/start')).toBe('/')
    expect(sanitizeRedirectTarget('')).toBe('/')
    expect(sanitizeRedirectTarget(undefined)).toBe('/')
  })
})
