import type { ReactNode } from 'react';

import { AppHeader } from './app-header';

type FrontendLayoutProps = {
  children: ReactNode;
};

export function FrontendLayout({ children }: FrontendLayoutProps) {
  return (
    <>
      <AppHeader />
      <div>{children}</div>
    </>
  );
}
