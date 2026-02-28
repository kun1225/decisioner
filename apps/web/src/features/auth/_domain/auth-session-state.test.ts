import { describe, expect, it } from 'vitest'

import {
  initialAuthSessionState,
  reduceAuthSessionState,
} from './auth-session-state'

describe('auth-session-state', () => {
  it('starts as unknown', () => {
    expect(initialAuthSessionState).toEqual({ status: 'unknown' })
  })

  it('transitions to authenticated without mutating previous state', () => {
    const previous = initialAuthSessionState

    const next = reduceAuthSessionState(previous, {
      type: 'authenticated',
      accessToken: 'token',
      user: {
        id: 'u1',
        email: 'joy@example.com',
        name: 'Joy',
      },
    })

    expect(next).toEqual({
      status: 'authenticated',
      accessToken: 'token',
      user: {
        id: 'u1',
        email: 'joy@example.com',
        name: 'Joy',
      },
    })
    expect(previous).toEqual({ status: 'unknown' })
    expect(next).not.toBe(previous)
  })

  it('transitions from authenticated to anonymous', () => {
    const state = reduceAuthSessionState(initialAuthSessionState, {
      type: 'authenticated',
      accessToken: 'token',
      user: {
        id: 'u1',
        email: 'joy@example.com',
        name: 'Joy',
      },
    })

    const anonymous = reduceAuthSessionState(state, { type: 'anonymous' })

    expect(anonymous).toEqual({ status: 'anonymous' })
  })
})
