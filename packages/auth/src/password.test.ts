import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from './password.js';

describe('password', () => {
  it('should hash a password and verify it correctly', async () => {
    const password = 'my-secure-password';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(await verifyPassword(password, hash)).toBe(true);
  });

  it('should reject wrong password', async () => {
    const hash = await hashPassword('correct-password');

    expect(await verifyPassword('wrong-password', hash)).toBe(false);
  });

  it('should produce different hashes for same password', async () => {
    const password = 'same-password';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });
});
