import { describe, expect, it } from 'vitest';

import {
  addTemplateItemSchema,
  updateTemplateItemSchema,
  updateTemplateSchema,
} from './templates.js';

describe('updateTemplateSchema', () => {
  it('rejects an empty patch payload', () => {
    const result = updateTemplateSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'At least one field must be provided',
    );
  });

  it('accepts a payload with at least one field', () => {
    const result = updateTemplateSchema.safeParse({
      name: 'Updated template',
    });

    expect(result.success).toBe(true);
  });
});

describe('addTemplateItemSchema', () => {
  it('accepts a payload without position to append to the end', () => {
    const result = addTemplateItemSchema.safeParse({
      exerciseId: '550e8400-e29b-41d4-a716-446655440000',
      note: 'Go heavy',
    });

    expect(result.success).toBe(true);
  });

  it('accepts a payload with a zero-based position', () => {
    const result = addTemplateItemSchema.safeParse({
      exerciseId: '550e8400-e29b-41d4-a716-446655440000',
      position: 0,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a negative position', () => {
    const result = addTemplateItemSchema.safeParse({
      exerciseId: '550e8400-e29b-41d4-a716-446655440000',
      position: -1,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'Position must be non-negative',
    );
  });

  it('rejects the legacy sortOrder field', () => {
    const result = addTemplateItemSchema.safeParse({
      exerciseId: '550e8400-e29b-41d4-a716-446655440000',
      sortOrder: 1,
    });

    expect(result.success).toBe(false);
  });
});

describe('updateTemplateItemSchema', () => {
  it('rejects an empty patch payload', () => {
    const result = updateTemplateItemSchema.safeParse({});

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'At least one field must be provided',
    );
  });

  it('accepts a payload with at least one field', () => {
    const result = updateTemplateItemSchema.safeParse({
      position: 1,
    });

    expect(result.success).toBe(true);
  });

  it('accepts a payload that updates note and position together', () => {
    const result = updateTemplateItemSchema.safeParse({
      note: 'Lighter warm-up',
      position: 2,
    });

    expect(result.success).toBe(true);
  });

  it('rejects a negative position', () => {
    const result = updateTemplateItemSchema.safeParse({
      position: -1,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      'Position must be non-negative',
    );
  });

  it('rejects the legacy sortOrder field', () => {
    const result = updateTemplateItemSchema.safeParse({
      sortOrder: 1,
    });

    expect(result.success).toBe(false);
  });
});
