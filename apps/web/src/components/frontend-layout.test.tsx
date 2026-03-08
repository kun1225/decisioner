import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FrontendLayout } from './frontend-layout';

vi.mock('./app-header', () => ({
  AppHeader: () => <div>Mock Header</div>,
}));

describe('frontend-layout', () => {
  it('renders header and page content', () => {
    render(
      <FrontendLayout>
        <div>Page Content</div>
      </FrontendLayout>,
    );

    expect(screen.getByText('Mock Header')).toBeTruthy();
    expect(screen.getByText('Page Content')).toBeTruthy();
  });
});
