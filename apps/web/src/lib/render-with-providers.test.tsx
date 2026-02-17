import { useQuery } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { mockFetchJsonOnce } from './mock-fetch';
import { renderWithProviders } from './render-with-providers';

function QueryConsumer() {
  const { data = { name: 'loading' } } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      return (await response.json()) as { name: string };
    },
  });

  return <p>{data.name}</p>;
}

describe('renderWithProviders', () => {
  it('renders component with react-query context', async () => {
    mockFetchJsonOnce({ name: 'Joy' });

    renderWithProviders(<QueryConsumer />);

    expect(await screen.findByText('Joy')).toBeDefined();
  });
});
