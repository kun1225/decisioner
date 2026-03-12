import supertest from 'supertest';

import { createApp } from '@/app.js';

export type TestAgent = ReturnType<typeof supertest.agent>;

export function createTestAgent(): TestAgent {
  return supertest.agent(createApp());
}

export function extractCookie(
  res: supertest.Response,
  name: string,
): string | undefined {
  const cookies = res.headers['set-cookie'] as string[] | undefined;
  if (!cookies) return undefined;

  for (const c of cookies) {
    if (c.startsWith(`${name}=`)) {
      return c.split(';')[0]!.split('=').slice(1).join('=');
    }
  }
  return undefined;
}

export function parseCookieFlags(
  res: supertest.Response,
  name: string,
): Record<string, string | true> | undefined {
  const cookies = res.headers['set-cookie'] as string[] | undefined;
  if (!cookies) return undefined;

  const cookie = cookies.find((c) => c.startsWith(`${name}=`));
  if (!cookie) return undefined;

  const flags: Record<string, string | true> = {};
  const parts = cookie.split(';').slice(1);
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    flags[key!.toLowerCase()] = rest.length > 0 ? rest.join('=') : true;
  }
  return flags;
}

export function withAuth(agent: TestAgent, accessToken: string) {
  return {
    delete: (path: string) =>
      agent.delete(path).set('Authorization', `Bearer ${accessToken}`),
    get: (path: string) =>
      agent.get(path).set('Authorization', `Bearer ${accessToken}`),
    patch: (path: string) =>
      agent.patch(path).set('Authorization', `Bearer ${accessToken}`),
    post: (path: string) =>
      agent.post(path).set('Authorization', `Bearer ${accessToken}`),
  };
}
