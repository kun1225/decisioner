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
    <header className="bg-background/90 supports-backdrop-filter:bg-background/70 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Button
          variant="ghost"
          className="text-foreground cursor-pointer px-0 text-lg font-semibold tracking-tight hover:bg-transparent"
          nativeButton={false}
          render={<a href={logoHref}>JoyGym</a>}
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
