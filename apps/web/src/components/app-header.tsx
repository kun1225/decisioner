import { Button } from '@/components/ui/button';

type AppHeaderProps = {
  isAuthenticated: boolean;
  logoHref: string;
  primaryHref: string;
};

export function AppHeader({
  isAuthenticated,
  logoHref,
  primaryHref,
}: AppHeaderProps) {
  const actionLabel = isAuthenticated ? 'Dashboard' : 'Login';

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

        <Button
          size="sm"
          className="cursor-pointer px-4"
          nativeButton={false}
          render={<a href={primaryHref}>{actionLabel}</a>}
        />
      </div>
    </header>
  );
}
