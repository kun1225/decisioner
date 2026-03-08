import { useRouterState } from '@tanstack/react-router';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthSessionState } from '@/features/auth/_domain/auth-session-provider';
import { useLogout } from '@/features/auth/_domain/use-logout';

export function AppHeader() {
  return (
    <header className="px-edge fixed inset-x-0 top-0 z-40 py-4">
      <div className="bg-background/90 supports-backdrop-filter:bg-background/70 flex h-16 w-full items-center justify-between rounded-full px-4 shadow backdrop-blur-lg md:px-8">
        <Button
          variant="ghost"
          className="text-foreground font-display cursor-pointer px-0 text-xl font-semibold tracking-tight hover:bg-transparent"
          nativeButton={false}
          render={
            <a href="/" className="flex gap-2">
              <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl">
                JG
              </span>
              <span className="hidden md:block">Joy Gym</span>
            </a>
          }
        />

        <HeaderAction />
      </div>
    </header>
  );
}

function HeaderAction() {
  const location = useRouterState({ select: (state) => state.location });
  const authSession = useAuthSessionState();
  const { handleLogout } = useLogout();

  const authStatus = authSession.status;
  const userName =
    authStatus === 'authenticated' ? authSession.user.name : undefined;
  const isAuthRoute = location.pathname.startsWith('/auth/');

  const primaryHref =
    authStatus === 'authenticated'
      ? '/dashboard'
      : isAuthRoute
        ? '/auth/login'
        : `/auth/login?redirect=${encodeURIComponent(`${location.pathname}${location.searchStr}${location.hash}`)}`;

  if (authStatus === 'unknown') {
    return null;
  }

  if (authStatus !== 'authenticated') {
    return (
      <Button
        size="sm"
        className="cursor-pointer px-4"
        nativeButton={false}
        render={<a href={primaryHref}>Login</a>}
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="sm" variant="outline" className="cursor-pointer px-4">
            {userName ?? 'User'}
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem render={<a href="/dashboard">Dashboard</a>} />
        <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
