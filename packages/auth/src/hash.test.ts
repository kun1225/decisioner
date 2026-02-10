import { describe, expect, it } from 'vitest';

import { hashToken } from './hash.js';

describe('hashToken', () => {
  it('should return a hex string', () => {
    const result = hashToken('some-token');

    expect(typeof result).toBe('string');
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should produce consistent hash for same input', () => {
    const hash1 = hashToken('same-token');
    const hash2 = hashToken('same-token');

    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different inputs', () => {
    const hash1 = hashToken('token-a');
    const hash2 = hashToken('token-b');

    expect(hash1).not.toBe(hash2);
  });
});
