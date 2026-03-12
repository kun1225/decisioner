import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import { db, sql } from '@repo/database/index';
import {
  closeTestDb,
  setupTestDb,
  truncateTables,
} from '@repo/database/test-utils/setup-test-db';

import {
  createTestAgent,
  type TestAgent,
  withAuth,
} from '@/test-utils/test-agent.js';

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

// ---------------------------------------------------------------------------
// Template CRUD
// ---------------------------------------------------------------------------
describe('template CRUD integration', () => {
  let agent: TestAgent;
  let accessToken: string;

  beforeEach(async () => {
    agent = createTestAgent();
    const res = await agent.post('/api/auth/register').send(VALID_REGISTER);
    accessToken = res.body.accessToken as string;
  });

  it('creates, lists, updates, and soft deletes templates', async () => {
    const createPush = await withAuth(agent, accessToken)
      .post('/api/templates')
      .send({ name: 'Push Day', description: 'Chest and shoulders' });
    expect(createPush.status).toBe(201);

    const createLeg = await withAuth(agent, accessToken)
      .post('/api/templates')
      .send({ name: 'Leg Day' });
    expect(createLeg.status).toBe(201);

    const listRes = await withAuth(agent, accessToken).get('/api/templates');
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(2);
    expect(listRes.body.map((t: { id: string }) => t.id)).toEqual(
      expect.arrayContaining([createPush.body.id, createLeg.body.id]),
    );

    const updateRes = await withAuth(agent, accessToken)
      .patch(`/api/templates/${createPush.body.id}`)
      .send({
        name: 'Upper Push Day',
        description: 'Chest, shoulders, and triceps',
      });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Upper Push Day');
    expect(updateRes.body.description).toBe('Chest, shoulders, and triceps');

    const detailRes = await withAuth(agent, accessToken).get(
      `/api/templates/${createPush.body.id}`,
    );
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.name).toBe('Upper Push Day');
    expect(detailRes.body.description).toBe('Chest, shoulders, and triceps');
    expect(detailRes.body.items).toEqual([]);

    const deleteRes = await withAuth(agent, accessToken).delete(
      `/api/templates/${createPush.body.id}`,
    );
    expect(deleteRes.status).toBe(204);

    const remainingRes = await withAuth(agent, accessToken).get(
      '/api/templates',
    );
    expect(remainingRes.status).toBe(200);
    expect(remainingRes.body).toHaveLength(1);
    expect(remainingRes.body[0].id).toBe(createLeg.body.id);

    const deletedRes = await withAuth(agent, accessToken).get(
      `/api/templates/${createPush.body.id}`,
    );
    expect(deletedRes.status).toBe(404);
    expect(deletedRes.body.error).toBe('Template not found');
  });
});

// ---------------------------------------------------------------------------
// Template ordering
// ---------------------------------------------------------------------------
describe('template ordering integration', () => {
  let agent: TestAgent;
  let accessToken: string;

  beforeEach(async () => {
    agent = createTestAgent();
    const res = await agent.post('/api/auth/register').send(VALID_REGISTER);
    accessToken = res.body.accessToken as string;
  });

  it('appends items to the end when position is omitted', async () => {
    const tplRes = await withAuth(agent, accessToken)
      .post('/api/templates')
      .send({ name: 'Push Day' });
    expect(tplRes.status).toBe(201);
    const templateId = tplRes.body.id as string;

    const squatRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Back Squat' });
    expect(squatRes.status).toBe(201);

    const benchRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Bench Press' });
    expect(benchRes.status).toBe(201);

    const item1 = await withAuth(agent, accessToken)
      .post(`/api/templates/${templateId}/items`)
      .send({ exerciseId: squatRes.body.id });
    expect(item1.status).toBe(201);

    const item2 = await withAuth(agent, accessToken)
      .post(`/api/templates/${templateId}/items`)
      .send({ exerciseId: benchRes.body.id });
    expect(item2.status).toBe(201);

    const detail = await withAuth(agent, accessToken).get(
      `/api/templates/${templateId}`,
    );
    expect(detail.status).toBe(200);
    expect(detail.body.items.map((i: { id: string }) => i.id)).toEqual([
      item1.body.id,
      item2.body.id,
    ]);
    expect(
      detail.body.items.map((i: { sortOrder: number }) => i.sortOrder),
    ).toEqual([0, 1]);
  });

  it('inserts an item at a specific position and shifts trailing items', async () => {
    const tplRes = await withAuth(agent, accessToken)
      .post('/api/templates')
      .send({ name: 'Leg Day' });
    expect(tplRes.status).toBe(201);
    const templateId = tplRes.body.id as string;

    const squatRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Front Squat' });
    expect(squatRes.status).toBe(201);

    const lungeRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Walking Lunge' });
    expect(lungeRes.status).toBe(201);

    const hingeRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Romanian Deadlift' });
    expect(hingeRes.status).toBe(201);

    const addSquat = await withAuth(agent, accessToken)
      .post(`/api/templates/${templateId}/items`)
      .send({ exerciseId: squatRes.body.id });
    expect(addSquat.status).toBe(201);

    const addHinge = await withAuth(agent, accessToken)
      .post(`/api/templates/${templateId}/items`)
      .send({ exerciseId: hingeRes.body.id });
    expect(addHinge.status).toBe(201);

    const insertLunge = await withAuth(agent, accessToken)
      .post(`/api/templates/${templateId}/items`)
      .send({ exerciseId: lungeRes.body.id, position: 1 });
    expect(insertLunge.status).toBe(201);

    const detail = await withAuth(agent, accessToken).get(
      `/api/templates/${templateId}`,
    );
    expect(detail.status).toBe(200);
    expect(
      detail.body.items.map((i: { exerciseId: string }) => i.exerciseId),
    ).toEqual([squatRes.body.id, lungeRes.body.id, hingeRes.body.id]);
    expect(
      detail.body.items.map((i: { sortOrder: number }) => i.sortOrder),
    ).toEqual([0, 1, 2]);
  });

  it('reorders items forward and backward through the patch endpoint', async () => {
    const tplRes = await withAuth(agent, accessToken)
      .post('/api/templates')
      .send({ name: 'Pull Day' });
    expect(tplRes.status).toBe(201);
    const templateId = tplRes.body.id as string;

    const rowRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Barbell Row' });
    expect(rowRes.status).toBe(201);

    const curlRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'EZ Curl' });
    expect(curlRes.status).toBe(201);

    const pullupRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Pull Up' });
    expect(pullupRes.status).toBe(201);

    const rowItem = await withAuth(agent, accessToken)
      .post(`/api/templates/${templateId}/items`)
      .send({ exerciseId: rowRes.body.id });
    expect(rowItem.status).toBe(201);

    const curlItem = await withAuth(agent, accessToken)
      .post(`/api/templates/${templateId}/items`)
      .send({ exerciseId: curlRes.body.id });
    expect(curlItem.status).toBe(201);

    const pullupItem = await withAuth(agent, accessToken)
      .post(`/api/templates/${templateId}/items`)
      .send({ exerciseId: pullupRes.body.id });
    expect(pullupItem.status).toBe(201);

    const moveToEnd = await withAuth(agent, accessToken)
      .patch(`/api/templates/${templateId}/items/${rowItem.body.id}`)
      .send({ position: 2 });
    expect(moveToEnd.status).toBe(200);

    const moveToFront = await withAuth(agent, accessToken)
      .patch(`/api/templates/${templateId}/items/${pullupItem.body.id}`)
      .send({ position: 0 });
    expect(moveToFront.status).toBe(200);

    const detail = await withAuth(agent, accessToken).get(
      `/api/templates/${templateId}`,
    );
    expect(detail.status).toBe(200);
    expect(
      detail.body.items.map((i: { exerciseId: string }) => i.exerciseId),
    ).toEqual([pullupRes.body.id, curlRes.body.id, rowRes.body.id]);
    expect(
      detail.body.items.map((i: { sortOrder: number }) => i.sortOrder),
    ).toEqual([0, 1, 2]);
  });

  it('compacts sortOrder after deleting a middle item', async () => {
    const tplRes = await withAuth(agent, accessToken)
      .post('/api/templates')
      .send({ name: 'Upper Day' });
    expect(tplRes.status).toBe(201);
    const templateId = tplRes.body.id as string;

    const pressRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Overhead Press' });
    expect(pressRes.status).toBe(201);

    const flyRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Cable Fly' });
    expect(flyRes.status).toBe(201);

    const dipRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Dip' });
    expect(dipRes.status).toBe(201);

    const addPress = await withAuth(agent, accessToken)
      .post(`/api/templates/${templateId}/items`)
      .send({ exerciseId: pressRes.body.id });
    expect(addPress.status).toBe(201);

    const addFly = await withAuth(agent, accessToken)
      .post(`/api/templates/${templateId}/items`)
      .send({ exerciseId: flyRes.body.id });
    expect(addFly.status).toBe(201);

    const addDip = await withAuth(agent, accessToken)
      .post(`/api/templates/${templateId}/items`)
      .send({ exerciseId: dipRes.body.id });
    expect(addDip.status).toBe(201);

    const removeRes = await withAuth(agent, accessToken).delete(
      `/api/templates/${templateId}/items/${addFly.body.id}`,
    );
    expect(removeRes.status).toBe(204);

    const detail = await withAuth(agent, accessToken).get(
      `/api/templates/${templateId}`,
    );
    expect(detail.status).toBe(200);
    expect(
      detail.body.items.map((i: { exerciseId: string }) => i.exerciseId),
    ).toEqual([pressRes.body.id, dipRes.body.id]);
    expect(
      detail.body.items.map((i: { sortOrder: number }) => i.sortOrder),
    ).toEqual([0, 1]);
  });

  it('returns 400 for an out-of-range item position', async () => {
    const tplRes = await withAuth(agent, accessToken)
      .post('/api/templates')
      .send({ name: 'Conditioning' });
    expect(tplRes.status).toBe(201);

    const bikeRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Bike Sprint' });
    expect(bikeRes.status).toBe(201);

    const res = await withAuth(agent, accessToken)
      .post(`/api/templates/${tplRes.body.id}/items`)
      .send({ exerciseId: bikeRes.body.id, position: 1 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Position out of range');
  });

  it('returns 403 when another user tries to mutate the template', async () => {
    // Register a second user (owner is from beforeEach)
    const strangerAgent = createTestAgent();
    const strangerRes = await strangerAgent.post('/api/auth/register').send({
      ...VALID_REGISTER,
      email: 'stranger@example.com',
      name: 'Stranger',
    });
    const strangerToken = strangerRes.body.accessToken as string;

    const tplRes = await withAuth(agent, accessToken)
      .post('/api/templates')
      .send({ name: 'Owner Only' });
    expect(tplRes.status).toBe(201);

    const exerciseRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Single-arm Row' });
    expect(exerciseRes.status).toBe(201);

    const itemRes = await withAuth(agent, accessToken)
      .post(`/api/templates/${tplRes.body.id}/items`)
      .send({ exerciseId: exerciseRes.body.id });
    expect(itemRes.status).toBe(201);

    const res = await withAuth(strangerAgent, strangerToken)
      .patch(`/api/templates/${tplRes.body.id}/items/${itemRes.body.id}`)
      .send({ position: 0 });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Forbidden');
  });

  it('returns 409 when a live ordering conflict hits the unique constraint', async () => {
    const tplRes = await withAuth(agent, accessToken)
      .post('/api/templates')
      .send({ name: 'Conflict Day' });
    expect(tplRes.status).toBe(201);
    const templateId = tplRes.body.id as string;

    const existingRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Incline Press' });
    expect(existingRes.status).toBe(201);

    const requestedRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Cable Raise' });
    expect(requestedRes.status).toBe(201);

    const conflictingRes = await withAuth(agent, accessToken)
      .post('/api/exercises/custom')
      .send({ name: 'Machine Fly' });
    expect(conflictingRes.status).toBe(201);

    const addExisting = await withAuth(agent, accessToken)
      .post(`/api/templates/${templateId}/items`)
      .send({ exerciseId: existingRes.body.id });
    expect(addExisting.status).toBe(201);

    await installOrderingConflictTrigger(
      templateId,
      conflictingRes.body.id as string,
    );

    try {
      const res = await withAuth(agent, accessToken)
        .post(`/api/templates/${templateId}/items`)
        .send({ exerciseId: requestedRes.body.id, position: 0 });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Template item ordering conflict');

      const detail = await withAuth(agent, accessToken).get(
        `/api/templates/${templateId}`,
      );
      expect(detail.status).toBe(200);
      expect(detail.body.items).toHaveLength(1);
      expect(
        detail.body.items.map((i: { exerciseId: string }) => i.exerciseId),
      ).toEqual([existingRes.body.id]);
      expect(
        detail.body.items.map((i: { sortOrder: number }) => i.sortOrder),
      ).toEqual([0]);
    } finally {
      await removeOrderingConflictTrigger();
    }
  });
});

// ---------------------------------------------------------------------------
// DB trigger helpers (used only by the ordering-conflict test)
// ---------------------------------------------------------------------------
async function installOrderingConflictTrigger(
  templateId: string,
  exerciseId: string,
) {
  const escapedTemplateId = templateId.replaceAll("'", "''");
  const escapedExerciseId = exerciseId.replaceAll("'", "''");

  await db.execute(
    sql.raw(`
      CREATE OR REPLACE FUNCTION test_force_template_item_ordering_conflict()
      RETURNS trigger AS $$
      BEGIN
        IF NEW.template_id::text = '${escapedTemplateId}'
          AND NEW.sort_order = 0
          AND NOT EXISTS (
            SELECT 1
            FROM template_items
            WHERE template_id = '${escapedTemplateId}'::uuid
              AND exercise_id = '${escapedExerciseId}'::uuid
          )
        THEN
          INSERT INTO template_items (template_id, exercise_id, sort_order, note)
          VALUES ('${escapedTemplateId}'::uuid, '${escapedExerciseId}'::uuid, 0, NULL);
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `),
  );
  await db.execute(sql`
    DROP TRIGGER IF EXISTS test_force_template_item_ordering_conflict_trigger
    ON template_items
  `);
  await db.execute(sql`
    CREATE TRIGGER test_force_template_item_ordering_conflict_trigger
    BEFORE UPDATE ON template_items
    FOR EACH ROW WHEN (NEW.sort_order = 0)
    EXECUTE FUNCTION test_force_template_item_ordering_conflict()
  `);
}

async function removeOrderingConflictTrigger() {
  await db.execute(sql`
    DROP TRIGGER IF EXISTS test_force_template_item_ordering_conflict_trigger
    ON template_items
  `);
  await db.execute(sql`
    DROP FUNCTION IF EXISTS test_force_template_item_ordering_conflict()
  `);
}
