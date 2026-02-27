import { describe, expect, it } from 'vitest'

import { RegisterPage, Route } from './register'

describe('register route module', () => {
  it('exports a route object', () => {
    expect(Route).toBeTruthy()
  })

  it('exports a page component', () => {
    expect(typeof RegisterPage).toBe('function')
  })
})
