import { describe, expect, it } from 'vitest';

import { createAuthReadyGate } from './auth-ready-gate';

describe('createAuthReadyGate', () => {
  it('starts with a pending promise', async () => {
    const gate = createAuthReadyGate();

    const result = await Promise.race([
      gate.wait().then(() => 'resolved'),
      new Promise<string>((r) => setTimeout(() => r('timeout'), 50)),
    ]);

    expect(result).toBe('timeout');
  });

  it('resolves when state transitions to authenticated', async () => {
    const gate = createAuthReadyGate();

    gate.onStateChange('authenticated');

    await expect(gate.wait()).resolves.toBeUndefined();
  });

  it('resolves when state transitions to anonymous', async () => {
    const gate = createAuthReadyGate();

    gate.onStateChange('anonymous');

    await expect(gate.wait()).resolves.toBeUndefined();
  });

  it('resets to pending when state returns to unknown', async () => {
    const gate = createAuthReadyGate();

    gate.onStateChange('authenticated');
    await gate.wait();

    gate.onStateChange('unknown');

    const result = await Promise.race([
      gate.wait().then(() => 'resolved'),
      new Promise<string>((r) => setTimeout(() => r('timeout'), 50)),
    ]);

    expect(result).toBe('timeout');
  });

  it('resolves the new promise after reset', async () => {
    const gate = createAuthReadyGate();

    gate.onStateChange('authenticated');
    await gate.wait();

    gate.onStateChange('unknown');
    gate.onStateChange('anonymous');

    await expect(gate.wait()).resolves.toBeUndefined();
  });
});
