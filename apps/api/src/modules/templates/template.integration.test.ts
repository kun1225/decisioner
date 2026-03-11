import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { db, sql } from '@repo/database/index';
import {
  closeTestDb,
  setupTestDb,
  truncateTables,
} from '@repo/database/test-utils/setup-test-db';

import { createTestAgent, type TestAgent } from '@/test-utils/test-agent.js';

type AuthContext = {
  accessToken: string;
  agent: TestAgent;
  user: {
    id: string;
  };
};

type TemplateResponse = {
  id: string;
  name: string;
};

type ExerciseResponse = {
  id: string;
  name: string;
};

type TemplateDetailResponse = TemplateResponse & {
  items: Array<{
    exerciseId: string;
    id: string;
    note: string | null;
    sortOrder: number;
  }>;
};

const VALID_REGISTER = {
  email: 'template-test@example.com',
  password: 'Str0ng!Pass1',
  confirmedPassword: 'Str0ng!Pass1',
  name: 'Template Test User',
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

function withAuth(agent: TestAgent, accessToken: string) {
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

async function registerAndAuthenticate(index: number): Promise<AuthContext> {
  const agent = createTestAgent();
  const response = await agent.post('/api/auth/register').send({
    ...VALID_REGISTER,
    email: `template-test-${index}@example.com`,
    name: `Template Test User ${index}`,
  });

  expect(response.status).toBe(201);

  return {
    accessToken: response.body.accessToken as string,
    agent,
    user: response.body.user as { id: string },
  };
}

async function createTemplate(
  agent: TestAgent,
  accessToken: string,
  name: string,
): Promise<TemplateResponse> {
  const response = await withAuth(agent, accessToken)
    .post('/api/templates')
    .send({ name });

  expect(response.status).toBe(201);

  return response.body as TemplateResponse;
}

async function createCustomExercise(
  agent: TestAgent,
  accessToken: string,
  name: string,
): Promise<ExerciseResponse> {
  const response = await withAuth(agent, accessToken)
    .post('/api/exercises/custom')
    .send({ name });

  expect(response.status).toBe(201);

  return response.body as ExerciseResponse;
}

async function addTemplateItem(
  agent: TestAgent,
  accessToken: string,
  templateId: string,
  exerciseId: string,
  position?: number,
) {
  const response = await withAuth(agent, accessToken)
    .post(`/api/templates/${templateId}/items`)
    .send(position === undefined ? { exerciseId } : { exerciseId, position });

  expect(response.status).toBe(201);

  return response.body as TemplateDetailResponse['items'][number];
}

async function getTemplateDetail(
  agent: TestAgent,
  accessToken: string,
  templateId: string,
) {
  const response = await withAuth(agent, accessToken).get(
    `/api/templates/${templateId}`,
  );

  expect(response.status).toBe(200);

  return response.body as TemplateDetailResponse;
}

async function installNegativeSortOrderDelayTrigger(templateId: string) {
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION test_sleep_template_item_negative_sort_order()
    RETURNS trigger AS $$
    BEGIN
      IF NEW.template_id::text = ${templateId} AND NEW.sort_order < 0 THEN
        PERFORM pg_sleep(0.35);
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  await db.execute(sql`
    DROP TRIGGER IF EXISTS test_sleep_template_item_negative_sort_order_trigger
    ON template_items
  `);
  await db.execute(sql`
    CREATE TRIGGER test_sleep_template_item_negative_sort_order_trigger
    BEFORE UPDATE ON template_items
    FOR EACH ROW
    EXECUTE FUNCTION test_sleep_template_item_negative_sort_order()
  `);
}

async function removeNegativeSortOrderDelayTrigger() {
  await db.execute(sql`
    DROP TRIGGER IF EXISTS test_sleep_template_item_negative_sort_order_trigger
    ON template_items
  `);
  await db.execute(sql`
    DROP FUNCTION IF EXISTS test_sleep_template_item_negative_sort_order()
  `);
}

async function insertConflictingTemplateItemWhenSlotIsFree(
  templateId: string,
  exerciseId: string,
) {
  const deadline = Date.now() + 1_500;

  while (Date.now() < deadline) {
    try {
      await db.execute(sql`
        INSERT INTO template_items (template_id, exercise_id, sort_order, note)
        VALUES (${templateId}, ${exerciseId}, 0, NULL)
      `);
      return;
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === '23505'
      ) {
        await new Promise((resolve) => setTimeout(resolve, 25));
        continue;
      }

      throw error;
    }
  }

  throw new Error('Failed to create a runtime ordering conflict');
}

describe('template ordering integration', () => {
  it('appends items to the end when position is omitted', async () => {
    const auth = await registerAndAuthenticate(1);
    const template = await createTemplate(
      auth.agent,
      auth.accessToken,
      'Push Day',
    );
    const squat = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'Back Squat',
    );
    const bench = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'Bench Press',
    );

    const firstItem = await addTemplateItem(
      auth.agent,
      auth.accessToken,
      template.id,
      squat.id,
    );
    const secondItem = await addTemplateItem(
      auth.agent,
      auth.accessToken,
      template.id,
      bench.id,
    );
    const detail = await getTemplateDetail(
      auth.agent,
      auth.accessToken,
      template.id,
    );

    expect(detail.items.map((item) => item.id)).toEqual([
      firstItem.id,
      secondItem.id,
    ]);
    expect(detail.items.map((item) => item.sortOrder)).toEqual([0, 1]);
  });

  it('inserts an item at a specific position and shifts trailing items', async () => {
    const auth = await registerAndAuthenticate(2);
    const template = await createTemplate(
      auth.agent,
      auth.accessToken,
      'Leg Day',
    );
    const squat = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'Front Squat',
    );
    const lunge = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'Walking Lunge',
    );
    const hinge = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'Romanian Deadlift',
    );

    await addTemplateItem(auth.agent, auth.accessToken, template.id, squat.id);
    await addTemplateItem(auth.agent, auth.accessToken, template.id, hinge.id);
    await addTemplateItem(
      auth.agent,
      auth.accessToken,
      template.id,
      lunge.id,
      1,
    );

    const detail = await getTemplateDetail(
      auth.agent,
      auth.accessToken,
      template.id,
    );

    expect(detail.items.map((item) => item.exerciseId)).toEqual([
      squat.id,
      lunge.id,
      hinge.id,
    ]);
    expect(detail.items.map((item) => item.sortOrder)).toEqual([0, 1, 2]);
  });

  it('reorders items forward and backward through the patch endpoint', async () => {
    const auth = await registerAndAuthenticate(3);
    const template = await createTemplate(
      auth.agent,
      auth.accessToken,
      'Pull Day',
    );
    const row = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'Barbell Row',
    );
    const curl = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'EZ Curl',
    );
    const pullup = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'Pull Up',
    );

    const rowItem = await addTemplateItem(
      auth.agent,
      auth.accessToken,
      template.id,
      row.id,
    );
    await addTemplateItem(auth.agent, auth.accessToken, template.id, curl.id);
    const pullupItem = await addTemplateItem(
      auth.agent,
      auth.accessToken,
      template.id,
      pullup.id,
    );

    const moveToEnd = await withAuth(auth.agent, auth.accessToken)
      .patch(`/api/templates/${template.id}/items/${rowItem.id}`)
      .send({ position: 2 });
    expect(moveToEnd.status).toBe(200);

    const moveToFront = await withAuth(auth.agent, auth.accessToken)
      .patch(`/api/templates/${template.id}/items/${pullupItem.id}`)
      .send({ position: 0 });
    expect(moveToFront.status).toBe(200);

    const detail = await getTemplateDetail(
      auth.agent,
      auth.accessToken,
      template.id,
    );

    expect(detail.items.map((item) => item.exerciseId)).toEqual([
      pullup.id,
      curl.id,
      row.id,
    ]);
    expect(detail.items.map((item) => item.sortOrder)).toEqual([0, 1, 2]);
  });

  it('compacts sortOrder after deleting a middle item', async () => {
    const auth = await registerAndAuthenticate(4);
    const template = await createTemplate(
      auth.agent,
      auth.accessToken,
      'Upper Day',
    );
    const press = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'Overhead Press',
    );
    const fly = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'Cable Fly',
    );
    const dip = await createCustomExercise(auth.agent, auth.accessToken, 'Dip');

    await addTemplateItem(auth.agent, auth.accessToken, template.id, press.id);
    const flyItem = await addTemplateItem(
      auth.agent,
      auth.accessToken,
      template.id,
      fly.id,
    );
    await addTemplateItem(auth.agent, auth.accessToken, template.id, dip.id);

    const removeResponse = await withAuth(auth.agent, auth.accessToken).delete(
      `/api/templates/${template.id}/items/${flyItem.id}`,
    );
    expect(removeResponse.status).toBe(204);

    const detail = await getTemplateDetail(
      auth.agent,
      auth.accessToken,
      template.id,
    );

    expect(detail.items.map((item) => item.exerciseId)).toEqual([
      press.id,
      dip.id,
    ]);
    expect(detail.items.map((item) => item.sortOrder)).toEqual([0, 1]);
  });

  it('returns 400 for an out-of-range item position', async () => {
    const auth = await registerAndAuthenticate(5);
    const template = await createTemplate(
      auth.agent,
      auth.accessToken,
      'Conditioning',
    );
    const bike = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'Bike Sprint',
    );

    const response = await withAuth(auth.agent, auth.accessToken)
      .post(`/api/templates/${template.id}/items`)
      .send({ exerciseId: bike.id, position: 1 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Position out of range');
  });

  it('returns 403 when another user tries to mutate the template', async () => {
    const owner = await registerAndAuthenticate(6);
    const stranger = await registerAndAuthenticate(7);
    const template = await createTemplate(
      owner.agent,
      owner.accessToken,
      'Owner Only',
    );
    const exercise = await createCustomExercise(
      owner.agent,
      owner.accessToken,
      'Single-arm Row',
    );
    const item = await addTemplateItem(
      owner.agent,
      owner.accessToken,
      template.id,
      exercise.id,
    );

    const response = await withAuth(stranger.agent, stranger.accessToken)
      .patch(`/api/templates/${template.id}/items/${item.id}`)
      .send({ position: 0 });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe('Forbidden');
  });

  it('returns 409 when a live ordering conflict hits the unique constraint', async () => {
    const auth = await registerAndAuthenticate(8);
    const template = await createTemplate(
      auth.agent,
      auth.accessToken,
      'Conflict Day',
    );
    const existingExercise = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'Incline Press',
    );
    const requestedExercise = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'Cable Raise',
    );
    const conflictingExercise = await createCustomExercise(
      auth.agent,
      auth.accessToken,
      'Machine Fly',
    );

    await addTemplateItem(
      auth.agent,
      auth.accessToken,
      template.id,
      existingExercise.id,
    );

    await installNegativeSortOrderDelayTrigger(template.id);

    try {
      const responsePromise = withAuth(auth.agent, auth.accessToken)
        .post(`/api/templates/${template.id}/items`)
        .send({ exerciseId: requestedExercise.id, position: 0 });

      await insertConflictingTemplateItemWhenSlotIsFree(
        template.id,
        conflictingExercise.id,
      );

      const response = await responsePromise;

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Template item ordering conflict');

      const detail = await getTemplateDetail(
        auth.agent,
        auth.accessToken,
        template.id,
      );

      expect(detail.items).toHaveLength(2);
      expect(detail.items.map((item) => item.exerciseId)).toEqual([
        existingExercise.id,
        conflictingExercise.id,
      ]);
      expect(detail.items.map((item) => item.sortOrder)).toEqual([0, 1]);
    } finally {
      await removeNegativeSortOrderDelayTrigger();
    }
  });
});
