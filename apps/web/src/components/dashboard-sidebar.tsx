import { Button } from '@/components/ui/button';

type DashboardSidebarProps = {
  userName?: string;
  onBrandClick: () => void;
  onDashboardClick: () => void;
  onLogout?: () => void;
};

export function DashboardSidebar({
  userName,
  onBrandClick,
  onDashboardClick,
  onLogout,
}: DashboardSidebarProps) {
  return (
    <aside className="bg-card sticky top-0 h-screen border-r">
      <div className="flex h-full flex-col gap-8 p-6">
        <Button
          type="button"
          onClick={onBrandClick}
          variant="ghost"
          className="text-foreground font-display w-fit cursor-pointer px-0 text-left text-xl font-semibold tracking-tight hover:bg-transparent"
        >
          JoyGym
        </Button>

        <nav aria-label="後台導覽" className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-[0.2em] uppercase">
            後台導覽
          </p>
          <Button
            type="button"
            onClick={onDashboardClick}
            variant="ghost"
            className="text-foreground hover:text-primary block w-full justify-start px-3 py-2 text-sm font-medium transition-colors"
          >
            儀表板
          </Button>
        </nav>

        <div className="mt-auto space-y-2">
          {userName && (
            <p className="text-muted-foreground truncate text-sm">{userName}</p>
          )}
          <Button
            type="button"
            onClick={onLogout}
            variant="outline"
            className="w-full cursor-pointer"
          >
            登出
          </Button>
        </div>
      </div>
    </aside>
  );
}
