import type { AuthSessionState } from '@/features/auth/_domain/auth-types';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type AppHeaderProps = {
  authStatus: AuthSessionState['status'];
  userName?: string;
  logoHref: string;
  primaryHref: string;
  onLogout?: () => void;
};

export function AppHeader({
  authStatus,
  userName,
  logoHref,
  primaryHref,
  onLogout,
}: AppHeaderProps) {
  return (
    <header className="px-edge fixed inset-x-0 top-0 z-40 py-4">
      <div className="bg-background/90 supports-backdrop-filter:bg-background/70 flex h-16 w-full items-center justify-between rounded-full px-4 shadow backdrop-blur-lg md:px-8">
        <Button
          variant="ghost"
          className="text-foreground cursor-pointer px-0 text-xl font-semibold tracking-tight hover:bg-transparent"
          nativeButton={false}
          render={
            <a href={logoHref} className="flex gap-2">
              <span className="bg-primary text-primary-foreground flex size-10 items-center justify-center rounded-xl">
                JG
              </span>
              <span className="hidden md:block">Joy Gym</span>
            </a>
          }
        />

        <HeaderAction
          authStatus={authStatus}
          userName={userName}
          primaryHref={primaryHref}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}

function HeaderAction({
  authStatus,
  userName,
  primaryHref,
  onLogout,
}: Pick<AppHeaderProps, 'authStatus' | 'userName' | 'primaryHref' | 'onLogout'>) {
  if (authStatus === 'unknown') {
    return (
      <Button size="sm" className="px-4" disabled>
        ...
      </Button>
    );
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
        <DropdownMenuItem render={<a href="/dashboard" />}>
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLogout}>登出</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
