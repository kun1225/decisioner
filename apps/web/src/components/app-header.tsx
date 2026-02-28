import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type AppHeaderProps = {
  isAuthenticated: boolean;
  onLogoClick: () => void;
  onPrimaryAction: () => void;
};

export function AppHeader({
  isAuthenticated,
  onLogoClick,
  onPrimaryAction,
}: AppHeaderProps) {
  const actionLabel = isAuthenticated ? 'Dashboard' : 'Login';

  return (
    <header className="bg-background/90 supports-backdrop-filter:bg-background/70 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={onLogoClick}
          className="text-foreground cursor-pointer text-lg font-semibold tracking-tight"
        >
          JoyGym
        </button>

        <button
          type="button"
          onClick={onPrimaryAction}
          className={cn(buttonVariants({ size: 'sm' }), 'cursor-pointer px-4')}
        >
          {actionLabel}
        </button>
      </div>
    </header>
  );
}
