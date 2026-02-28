import type { ReactNode } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="bg-brand-auth-gradient relative flex min-h-svh items-center overflow-hidden px-4 py-6 sm:px-6">
      <div
        aria-hidden
        className="bg-primary/10 absolute -top-20 left-1/2 size-72 -translate-x-1/2 rounded-full blur-3xl"
      />
      <div
        aria-hidden
        className="bg-brand-green-glow/40 absolute right-0 bottom-0 size-64 rounded-full blur-3xl"
      />

      <section className="relative mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4 lg:pr-8">
          <p className="text-primary text-sm font-semibold tracking-[0.2em] uppercase">
            JoyGym
          </p>
          <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
            Build strength with secure sessions.
          </h1>
          <p className="text-muted-foreground max-w-md text-base leading-relaxed">
            Sign in to continue tracking workouts, save templates, and keep your
            training history synced.
          </p>
        </div>

        <Card className="border-primary/15 bg-background/90 ring-primary/10 shadow-lg backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {children}
            {footer}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
