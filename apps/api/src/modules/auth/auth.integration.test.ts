import jwt from 'jsonwebtoken';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  closeTestDb,
  setupTestDb,
  truncateTables,
} from '@repo/database/test-utils/setup-test-db';

import {
  createTestAgent,
  extractCookie,
  parseCookieFlags,
  type TestAgent,
} from '@/test-utils/test-agent.js';

const VALID_REGISTER = {
  email: 'test@example.com',
  password: 'Str0ng!Pass1',
  confirmedPassword: 'Str0ng!Pass1',
  name: 'Test User',
};

const VALID_LOGIN = {
  email: VALID_REGISTER.email,
  password: VALID_REGISTER.password,
};

beforeAll(async () => {
  await setupTestDb();
}, 30_000);

afterEach(async () => {
  await truncateTables();
});

afterAll(async () => {
  await closeTestDb();
});

let agent: TestAgent;
beforeEach(() => {
  agent = createTestAgent();
});

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------
describe('POST /api/auth/register', () => {
  it('returns 201 with user and accessToken', async () => {
    const res = await agent.post('/api/auth/register').send(VALID_REGISTER);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).toMatchObject({
      email: VALID_REGISTER.email,
      name: VALID_REGISTER.name,
    });
    expect(res.body.user).toHaveProperty('id');
  });

  it('sets refresh_token cookie with correct flags', async () => {
    const res = await agent.post('/api/auth/register').send(VALID_REGISTER);

    const flags = parseCookieFlags(res, 'refresh_token');
    expect(flags).toBeDefined();
    expect(flags!['httponly']).toBe(true);
    expect(flags!['samesite']).toBe('Strict');
    expect(flags!['path']).toBe('/api/auth');
  });

  it('sets session_presence cookie with correct flags', async () => {
    const res = await agent.post('/api/auth/register').send(VALID_REGISTER);

    const flags = parseCookieFlags(res, 'session_presence');
    expect(flags).toBeDefined();
    expect(flags!['httponly']).toBe(true);
    expect(flags!['samesite']).toBe('Strict');
    expect(flags!['path']).toBe('/');
  });

  it('returns 409 when email already registered', async () => {
    await agent.post('/api/auth/register').send(VALID_REGISTER);

    const agent2 = createTestAgent();
    const res = await agent2.post('/api/auth/register').send(VALID_REGISTER);

    expect(res.status).toBe(409);
  });

  it('returns 400 on invalid input (weak password)', async () => {
    const res = await agent.post('/api/auth/register').send({
      email: 'bad@example.com',
      password: 'weak',
      confirmedPassword: 'weak',
      name: 'Bad',
    });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await agent.post('/api/auth/register').send(VALID_REGISTER);
    agent = createTestAgent();
  });

  it('returns 200 with accessToken on valid credentials', async () => {
    const res = await agent.post('/api/auth/login').send(VALID_LOGIN);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('sets refresh_token and session_presence cookies', async () => {
    const res = await agent.post('/api/auth/login').send(VALID_LOGIN);

    expect(extractCookie(res, 'refresh_token')).toBeDefined();
    expect(extractCookie(res, 'session_presence')).toBeDefined();
  });

  it('returns 401 on wrong password', async () => {
    const res = await agent.post('/api/auth/login').send({
      email: VALID_LOGIN.email,
      password: 'WrongPass!1',
    });

    expect(res.status).toBe(401);
  });

  it('returns 401 on non-existent email', async () => {
    const res = await agent.post('/api/auth/login').send({
      email: 'nobody@example.com',
      password: 'Whatever!1',
    });

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/refresh
// ---------------------------------------------------------------------------
describe('POST /api/auth/refresh', () => {
  beforeEach(async () => {
    await agent.post('/api/auth/register').send(VALID_REGISTER);
  });

  it('returns 200 with new accessToken when valid refresh cookie sent', async () => {
    const res = await agent.post('/api/auth/refresh');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('rotates refresh cookie (new value differs from old)', async () => {
    const regRes = await createTestAgent()
      .post('/api/auth/register')
      .send({
        ...VALID_REGISTER,
        email: 'rotate@example.com',
      });

    const oldRefresh = extractCookie(regRes, 'refresh_token');

    const refreshAgent = createTestAgent();
    const refreshRes = await refreshAgent
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${oldRefresh}`);

    const newRefresh = extractCookie(refreshRes, 'refresh_token');

    expect(refreshRes.status).toBe(200);
    expect(newRefresh).toBeDefined();
    expect(newRefresh).not.toBe(oldRefresh);
  });

  it('returns 401 when no refresh cookie present', async () => {
    const freshAgent = createTestAgent();
    const res = await freshAgent.post('/api/auth/refresh');

    expect(res.status).toBe(401);
  });

  it('clears both cookies on 401 (no cookie case)', async () => {
    const freshAgent = createTestAgent();
    const res = await freshAgent.post('/api/auth/refresh');

    expect(res.status).toBe(401);
    const refreshVal = extractCookie(res, 'refresh_token');
    const presenceVal = extractCookie(res, 'session_presence');
    // Cleared cookies have empty value
    expect(refreshVal === '' || refreshVal === undefined).toBe(true);
    expect(presenceVal === '' || presenceVal === undefined).toBe(true);
  });

  it('returns 401 and clears cookies when malformed token', async () => {
    const freshAgent = createTestAgent();
    const res = await freshAgent
      .post('/api/auth/refresh')
      .set('Cookie', 'refresh_token=not-a-jwt');

    expect(res.status).toBe(401);
    const refreshVal = extractCookie(res, 'refresh_token');
    expect(refreshVal === '' || refreshVal === undefined).toBe(true);
  });

  it('returns 401 and clears cookies when expired token', async () => {
    const expired = jwt.sign(
      { userId: 'u', jti: 'j', familyId: 'f' },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '0s' },
    );

    const freshAgent = createTestAgent();
    const res = await freshAgent
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${expired}`);

    expect(res.status).toBe(401);
    const refreshVal = extractCookie(res, 'refresh_token');
    expect(refreshVal === '' || refreshVal === undefined).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/refresh — reuse detection
// ---------------------------------------------------------------------------
describe('POST /api/auth/refresh — reuse detection', () => {
  it('revokes entire family when already-rotated token is reused', async () => {
    const regRes = await createTestAgent()
      .post('/api/auth/register')
      .send({
        ...VALID_REGISTER,
        email: 'reuse@example.com',
      });

    const oldRefresh = extractCookie(regRes, 'refresh_token')!;

    // Rotate once (old token is now revoked)
    const rotateAgent = createTestAgent();
    const rotateRes = await rotateAgent
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${oldRefresh}`);
    expect(rotateRes.status).toBe(200);

    // Attempt reuse with the old token
    const reuseAgent = createTestAgent();
    const reuseRes = await reuseAgent
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${oldRefresh}`);

    expect(reuseRes.status).toBe(401);
  });

  it('after reuse, even the latest legitimate token is revoked', async () => {
    const regRes = await createTestAgent()
      .post('/api/auth/register')
      .send({
        ...VALID_REGISTER,
        email: 'reuse2@example.com',
      });

    const oldRefresh = extractCookie(regRes, 'refresh_token')!;

    // Rotate to get new legitimate token
    const rotateAgent = createTestAgent();
    const rotateRes = await rotateAgent
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${oldRefresh}`);
    const newRefresh = extractCookie(rotateRes, 'refresh_token')!;

    // Trigger reuse detection with old token
    const reuseAgent = createTestAgent();
    await reuseAgent
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${oldRefresh}`);

    // Now even the new legitimate token should be revoked
    const legitimateAgent = createTestAgent();
    const res = await legitimateAgent
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${newRefresh}`);

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
describe('POST /api/auth/logout', () => {
  beforeEach(async () => {
    await agent.post('/api/auth/register').send(VALID_REGISTER);
  });

  it('returns 204 and clears both cookies', async () => {
    const res = await agent.post('/api/auth/logout');

    expect(res.status).toBe(204);
    const refreshVal = extractCookie(res, 'refresh_token');
    const presenceVal = extractCookie(res, 'session_presence');
    expect(refreshVal === '' || refreshVal === undefined).toBe(true);
    expect(presenceVal === '' || presenceVal === undefined).toBe(true);
  });

  it('after logout, refresh with old token fails with 401', async () => {
    const regRes = await createTestAgent()
      .post('/api/auth/register')
      .send({
        ...VALID_REGISTER,
        email: 'logout@example.com',
      });

    const oldRefresh = extractCookie(regRes, 'refresh_token')!;

    // Logout using the agent (sends cookie automatically)
    const logoutAgent = createTestAgent();
    await logoutAgent
      .post('/api/auth/logout')
      .set('Cookie', `refresh_token=${oldRefresh}`);

    // Try to refresh with the old token
    const refreshAgent = createTestAgent();
    const res = await refreshAgent
      .post('/api/auth/refresh')
      .set('Cookie', `refresh_token=${oldRefresh}`);

    expect(res.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------
describe('GET /api/auth/me', () => {
  it('returns user data with valid access token', async () => {
    const regRes = await agent.post('/api/auth/register').send(VALID_REGISTER);
    const { accessToken } = regRes.body;

    const meAgent = createTestAgent();
    const res = await meAgent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      email: VALID_REGISTER.email,
      name: VALID_REGISTER.name,
    });
    expect(res.body).toHaveProperty('id');
  });

  it('does not return hashedPassword or googleSub', async () => {
    const regRes = await agent.post('/api/auth/register').send(VALID_REGISTER);
    const { accessToken } = regRes.body;

    const meAgent = createTestAgent();
    const res = await meAgent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.body).not.toHaveProperty('hashedPassword');
    expect(res.body).not.toHaveProperty('googleSub');
  });

  it('returns 401 without Authorization header', async () => {
    const freshAgent = createTestAgent();
    const res = await freshAgent.get('/api/auth/me');

    expect(res.status).toBe(401);
  });

  it('returns 401 with invalid token', async () => {
    const freshAgent = createTestAgent();
    const res = await freshAgent
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-token');

    expect(res.status).toBe(401);
  });
});
