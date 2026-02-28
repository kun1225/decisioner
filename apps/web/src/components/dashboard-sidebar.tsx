import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type DashboardSidebarProps = {
  isAuthenticated: boolean;
  onBrandClick: () => void;
  onDashboardClick: () => void;
  onAuthActionClick: () => void;
};

export function DashboardSidebar({
  isAuthenticated,
  onBrandClick,
  onDashboardClick,
  onAuthActionClick,
}: DashboardSidebarProps) {
  const authActionLabel = isAuthenticated ? '前往前台' : '登入';

  return (
    <aside className="bg-card sticky top-0 h-screen border-r">
      <div className="flex h-full flex-col gap-8 p-6">
        <button
          type="button"
          onClick={onBrandClick}
          className="text-foreground w-fit cursor-pointer text-left text-xl font-semibold tracking-tight"
        >
          JoyGym
        </button>

        <nav aria-label="後台導覽" className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
            後台導覽
          </p>
          <button
            type="button"
            onClick={onDashboardClick}
            className="text-foreground hover:text-primary block rounded-md px-3 py-2 text-sm font-medium transition-colors"
          >
            儀表板
          </button>
        </nav>

        <div className="mt-auto">
          <button
            type="button"
            onClick={onAuthActionClick}
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'w-full cursor-pointer',
            )}
          >
            {authActionLabel}
          </button>
        </div>
      </div>
    </aside>
  );
}
