import { describe, expect, it } from 'vitest';

import {
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
      sortOrder: 1,
    });

    expect(result.success).toBe(true);
  });
});
