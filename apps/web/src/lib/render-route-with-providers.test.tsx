import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { renderRouteWithProviders } from './render-route-with-providers'

describe('renderRouteWithProviders', () => {
  it('renders route component in memory history', async () => {
    renderRouteWithProviders({
      path: '/__test',
      component: () => <p>auth route test</p>,
    })

    expect(await screen.findByText('auth route test')).toBeDefined()
  })
})
