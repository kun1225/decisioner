import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory, createRouter } from '@tanstack/react-router';
import { describe, expect, it } from 'vitest';

import { routeTree } from '@/routeTree.gen';

type SmokeRouter = ReturnType<typeof createRouter>;

function createSmokeRouter(initialPath: string): SmokeRouter {
  return createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [initialPath],
    }),
    context: {
      queryClient: new QueryClient(),
    },
    defaultPreload: 'intent',
  });
}

async function loadRouter(initialPath: string): Promise<SmokeRouter> {
  const router = createSmokeRouter(initialPath);
  await router.load();
  return router;
}

function getMatchedRouteIds(router: SmokeRouter): Array<string> {
  return router.state.matches.map((match) => match.routeId);
}

describe('auth route wiring smoke', () => {
  it('initializes router directly at /auth/login', async () => {
    const router = await loadRouter('/auth/login');

    expect(router.state.location.pathname).toBe('/auth/login');
    expect(getMatchedRouteIds(router)).toContain('/auth/login');
  });

  it('initializes router directly at /auth/register', async () => {
    const router = await loadRouter('/auth/register');

    expect(router.state.location.pathname).toBe('/auth/register');
    expect(getMatchedRouteIds(router)).toContain('/auth/register');
  });

  it('includes root route match for auth login', async () => {
    const router = await loadRouter('/auth/login');
    const routeIds = getMatchedRouteIds(router);

    expect(routeIds).toContain('__root__');
    expect(routeIds).toContain('/auth/login');
  });

  it('includes root route match for auth register', async () => {
    const router = await loadRouter('/auth/register');
    const routeIds = getMatchedRouteIds(router);

    expect(routeIds).toContain('__root__');
    expect(routeIds).toContain('/auth/register');
  });

  it('navigates from /auth/login to /auth/register', async () => {
    const router = await loadRouter('/auth/login');

    await router.navigate({ to: '/auth/register' });

    expect(router.state.location.pathname).toBe('/auth/register');
    expect(getMatchedRouteIds(router)).toContain('/auth/register');
  });

  it('navigates from /auth/register to /auth/login', async () => {
    const router = await loadRouter('/auth/register');

    await router.navigate({ to: '/auth/login' });

    expect(router.state.location.pathname).toBe('/auth/login');
    expect(getMatchedRouteIds(router)).toContain('/auth/login');
  });

  it('navigates from /auth/login to /demo/start/api-request', async () => {
    const router = await loadRouter('/auth/login');

    await router.navigate({ to: '/demo/start/api-request' });

    expect(router.state.location.pathname).toBe('/demo/start/api-request');
    expect(getMatchedRouteIds(router)).toContain('/demo/start/api-request');
  });

  it('navigates from /demo/start/api-request back to /auth/login', async () => {
    const router = await loadRouter('/demo/start/api-request');

    await router.navigate({ to: '/auth/login' });

    expect(router.state.location.pathname).toBe('/auth/login');
    expect(getMatchedRouteIds(router)).toContain('/auth/login');
  });

  it('navigates from /auth/register to /demo/tanstack-query', async () => {
    const router = await loadRouter('/auth/register');

    await router.navigate({ to: '/demo/tanstack-query' });

    expect(router.state.location.pathname).toBe('/demo/tanstack-query');
    expect(getMatchedRouteIds(router)).toContain('/demo/tanstack-query');
  });

  it('keeps auth route ids in tree after router load', async () => {
    const router = await loadRouter('/auth/login');
    const rootChildren =
      (router.routeTree as unknown as { children?: Array<{ id?: string }> })
        .children ?? [];
    const ids = rootChildren.map((child) => child.id);

    expect(ids).toContain('/auth/login');
    expect(ids).toContain('/auth/register');
  });
});
