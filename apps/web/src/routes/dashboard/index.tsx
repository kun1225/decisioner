import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardPlaceholderPage,
});

function DashboardPlaceholderPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground mt-4 text-base">
        This placeholder route exists for post-auth redirects in G-18 PR-2.
      </p>
    </main>
  );
}
