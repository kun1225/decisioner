import { describe, expect, it } from 'vitest'

import { LoginPage, Route } from './login'

describe('login route module', () => {
  it('exports a route object', () => {
    expect(Route).toBeTruthy()
  })

  it('exports a page component', () => {
    expect(typeof LoginPage).toBe('function')
  })
})
